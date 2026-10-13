import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env, Job, AppSettings } from './types';
import { runAllCloudScrapers } from './services/scrapers/manager';
import { evaluateJobCompetency } from './services/matcher';
import { extractHrEmail } from './services/hr-finder';
import { generateColdEmail } from './services/email-generator';
import { sendEmail } from './services/mailer';

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for Vite local dev
app.use('*', cors());

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Dashboard Analytics / Stats
app.get('/api/stats', async (c) => {
  try {
    const totalJobsRes = await c.env.DB.prepare('SELECT COUNT(*) as count FROM jobs').first<{ count: number }>();
    const highMatchRes = await c.env.DB.prepare('SELECT COUNT(*) as count FROM jobs WHERE match_score >= 70').first<{ count: number }>();
    const sentEmailsRes = await c.env.DB.prepare("SELECT COUNT(*) as count FROM emails WHERE status = 'sent'").first<{ count: number }>();
    const pendingJobsRes = await c.env.DB.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'new' AND match_score >= 50").first<{ count: number }>();
    const partTimeJobsRes = await c.env.DB.prepare("SELECT COUNT(*) as count FROM jobs WHERE job_type LIKE '%part%'").first<{ count: number }>();

    return c.json({
      totalJobs: totalJobsRes?.count || 0,
      highMatchJobs: highMatchRes?.count || 0,
      sentEmails: sentEmailsRes?.count || 0,
      pendingReview: pendingJobsRes?.count || 0,
      partTimeCount: partTimeJobsRes?.count || 0
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// List and filter jobs
app.get('/api/jobs', async (c) => {
  try {
    const status = c.req.query('status') || '';
    const minScore = parseInt(c.req.query('minScore') || '0', 10);
    const search = c.req.query('search') || '';
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '20', 10);
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM jobs WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (minScore > 0) {
      query += ' AND match_score >= ?';
      params.push(minScore);
    }

    if (search) {
      query += ' AND (title LIKE ? OR company LIKE ? OR tags LIKE ? OR description LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY match_score DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = c.env.DB.prepare(query);
    const jobs = await stmt.bind(...params).all<Job>();

    // Total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM jobs WHERE 1=1';
    const countParams: any[] = [];
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (minScore > 0) {
      countQuery += ' AND match_score >= ?';
      countParams.push(minScore);
    }
    if (search) {
      countQuery += ' AND (title LIKE ? OR company LIKE ? OR tags LIKE ? OR description LIKE ?)';
      const s = `%${search}%`;
      countParams.push(s, s, s, s);
    }

    const totalCountRes = await c.env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>();

    return c.json({
      jobs: jobs.results || [],
      total: totalCountRes?.total || 0,
      page,
      limit
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Single job details
app.get('/api/jobs/:id', async (c) => {
  const id = c.req.param('id');
  const job = await c.env.DB.prepare('SELECT * FROM jobs WHERE id = ?').bind(id).first<Job>();
  if (!job) return c.json({ error: 'Job not found' }, 404);
  return c.json(job);
});

// Update job status
app.post('/api/jobs/:id/status', async (c) => {
  const id = c.req.param('id');
  const { status } = await c.req.json<{ status: string }>();

  await c.env.DB.prepare(
    "UPDATE jobs SET status = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(status, id).run();

  return c.json({ success: true, id, status });
});

// Trigger cloud scraping
app.post('/api/jobs/scrape', async (c) => {
  try {
    const result = await runAllCloudScrapers(c.env);
    return c.json({
      success: true,
      ...result
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Ingest jobs from Local Laptop Scraper
app.post('/api/jobs/sync', async (c) => {
  try {
    const authHeader = c.req.header('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    const expectedToken = c.env.LOCAL_SYNC_TOKEN || 'opp-hunter-secret-token';

    if (token !== expectedToken) {
      return c.json({ error: 'Unauthorized: Invalid sync token' }, 401);
    }

    const payload = await c.req.json<{ jobs: Partial<Job>[] }>();
    const incomingJobs = payload.jobs || [];

    let importedCount = 0;

    for (const job of incomingJobs) {
      if (!job.title || !job.company || !job.url) continue;

      const id = job.id || `local_${Math.random().toString(36).substring(7)}`;

      // Evaluate match score if not provided
      const match = evaluateJobCompetency(
        job.title,
        job.description || '',
        job.tags ? (typeof job.tags === 'string' ? JSON.parse(job.tags) : job.tags) : [],
        job.location || 'Remote',
        job.job_type || 'part-time'
      );

      if (match.score === 0 && (match.reasons?.[0]?.startsWith('Skipped:') || false)) {
        continue;
      }

      const finalScore = match.score;
      const reasons = JSON.stringify(match.reasons);
      const hrEmail = job.hr_email || extractHrEmail(job.description || '', job.company_url || '', job.company) || null;

      // Upsert
      await c.env.DB.prepare(`
        INSERT INTO jobs (
          id, source, external_id, title, company, company_url, location,
          is_remote, job_type, url, hr_email, salary, tags, description,
          match_score, match_reasons, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          match_score = excluded.match_score,
          hr_email = COALESCE(excluded.hr_email, jobs.hr_email),
          updated_at = datetime('now')
      `).bind(
        id,
        job.source || 'local_runner',
        job.external_id || null,
        job.title,
        job.company,
        job.company_url || null,
        job.location || 'Remote',
        job.is_remote ?? 1,
        job.job_type || 'part-time',
        job.url,
        hrEmail,
        job.salary || null,
        typeof job.tags === 'string' ? job.tags : JSON.stringify(job.tags || []),
        job.description ? job.description.substring(0, 4000) : null,
        finalScore,
        reasons,
        job.status || 'new'
      ).run();

      importedCount++;
    }

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO activity_logs (type, message, details)
      VALUES (?, ?, ?)
    `).bind(
      'sync',
      `Synced ${importedCount} jobs from local runner`,
      JSON.stringify({ importedCount, totalReceived: incomingJobs.length })
    ).run();

    return c.json({ success: true, count: importedCount });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Draft email for a job
app.post('/api/emails/draft/:jobId', async (c) => {
  try {
    const jobId = c.req.param('jobId');
    const job = await c.env.DB.prepare('SELECT * FROM jobs WHERE id = ?').bind(jobId).first<Job>();
    if (!job) return c.json({ error: 'Job not found' }, 404);

    const settingsRows = await c.env.DB.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>();
    const settings: Record<string, string> = {};
    for (const r of settingsRows.results || []) {
      settings[r.key] = r.value;
    }

    const draft = generateColdEmail(job, settings as Partial<AppSettings>);
    return c.json({
      jobId,
      recipientEmail: job.hr_email || '',
      recipientName: job.company,
      subject: draft.subject,
      bodyText: draft.bodyText,
      bodyHtml: draft.bodyHtml
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Send email
app.post('/api/emails/send', async (c) => {
  try {
    const { jobId, recipientEmail, recipientName, subject, bodyText, bodyHtml } = await c.req.json<{
      jobId?: string;
      recipientEmail: string;
      recipientName?: string;
      subject: string;
      bodyText: string;
      bodyHtml?: string;
    }>();

    if (!recipientEmail || !subject || !bodyText) {
      return c.json({ error: 'Recipient email, subject, and body are required' }, 400);
    }

    const result = await sendEmail(
      c.env,
      jobId || null,
      recipientEmail,
      recipientName || '',
      subject,
      bodyText,
      bodyHtml || bodyText
    );

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({ success: true, messageId: result.messageId });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// List sent emails
app.get('/api/emails', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const emails = await c.env.DB.prepare(
      'SELECT * FROM emails ORDER BY created_at DESC LIMIT ?'
    ).bind(limit).all();

    return c.json({ emails: emails.results || [] });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Get Settings
app.get('/api/settings', async (c) => {
  try {
    const rows = await c.env.DB.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>();
    const settings: Record<string, string> = {};
    for (const r of rows.results || []) {
      settings[r.key] = r.value;
    }
    return c.json(settings);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Update Settings
app.put('/api/settings', async (c) => {
  try {
    const newSettings = await c.req.json<Record<string, string>>();

    for (const [key, value] of Object.entries(newSettings)) {
      await c.env.DB.prepare(`
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = datetime('now')
      `).bind(key, String(value)).run();
    }

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Activity logs
app.get('/api/logs', async (c) => {
  try {
    const logs = await c.env.DB.prepare(
      'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 50'
    ).all();
    return c.json({ logs: logs.results || [] });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Cloudflare Workers entrypoint handling both fetch & cron triggers
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // If API route, handle with Hono
    if (url.pathname.startsWith('/api')) {
      return app.fetch(request, env, ctx);
    }

    // Serve static assets via Cloudflare Workers assets binding if present
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    // Fallback
    return app.fetch(request, env, ctx);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Cron triggered at ${new Date().toISOString()}: running cloud job scrapers...`);
    ctx.waitUntil(runAllCloudScrapers(env));
  }
};
