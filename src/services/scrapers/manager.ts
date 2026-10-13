import { Env, Job, AppSettings } from '../../types';
import { scrapeRemoteOk } from './remoteok';
import { scrapeRemotive } from './remotive';
import { scrapeJobicy } from './jobicy';
import { scrapeArbeitnow } from './arbeitnow';
import { scrapeWeWorkRemotely } from './weworkremotely';
import { generateColdEmail } from '../email-generator';
import { sendEmail } from '../mailer';

export async function runAllCloudScrapers(env: Env): Promise<{ totalScraped: number; newSaved: number }> {
  console.log('Starting cloud scraper run...');

  // Run all scrapers in parallel
  const [remoteOkJobs, remotiveJobs, jobicyJobs, arbeitnowJobs, wwrJobs] = await Promise.all([
    scrapeRemoteOk(),
    scrapeRemotive(),
    scrapeJobicy(),
    scrapeArbeitnow(),
    scrapeWeWorkRemotely()
  ]);

  const allJobs = [
    ...remoteOkJobs,
    ...remotiveJobs,
    ...jobicyJobs,
    ...arbeitnowJobs,
    ...wwrJobs
  ];

  let newSaved = 0;

  // Fetch settings for auto-pilot check
  const settingsRows = await env.DB.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>();
  const settings: Record<string, string> = {};
  for (const row of settingsRows.results || []) {
    settings[row.key] = row.value;
  }

  const autoSendEnabled = settings.auto_send_enabled === 'true';
  const autoSendThreshold = parseInt(settings.auto_send_threshold || '85', 10);
  const dailyLimit = parseInt(settings.daily_send_limit || '15', 10);

  // Check today's sent count
  const todaySentCountRes = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM emails WHERE status = 'sent' AND date(sent_at) = date('now')"
  ).first<{ count: number }>();
  let todaySentCount = todaySentCountRes?.count || 0;

  for (const job of allJobs) {
    if (!job.title || !job.company || !job.url) continue;

    const id = job.id || `job_${Math.random().toString(36).substring(7)}`;

    // Check if job already exists (by URL or ID)
    const existing = await env.DB.prepare(
      'SELECT id, status FROM jobs WHERE id = ? OR url = ?'
    ).bind(id, job.url).first<{ id: string; status: string }>();

    if (!existing) {
      // Insert new job
      await env.DB.prepare(`
        INSERT INTO jobs (
          id, source, external_id, title, company, company_url, location, 
          is_remote, job_type, url, hr_email, salary, tags, description, 
          match_score, match_reasons, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        job.source || 'cloud',
        job.external_id || null,
        job.title,
        job.company,
        job.company_url || null,
        job.location || 'Remote',
        job.is_remote ?? 1,
        job.job_type || 'part-time',
        job.url,
        job.hr_email || null,
        job.salary || null,
        job.tags || null,
        job.description || null,
        job.match_score || 0,
        job.match_reasons || null,
        'new'
      ).run();

      newSaved++;

      // Auto-pilot check: High match + HR email found + Auto-send enabled + Within daily limit
      if (
        autoSendEnabled &&
        (job.match_score || 0) >= autoSendThreshold &&
        job.hr_email &&
        todaySentCount < dailyLimit
      ) {
        try {
          const fullJobRecord: Job = {
            id,
            source: job.source || 'cloud',
            title: job.title,
            company: job.company,
            url: job.url,
            is_remote: job.is_remote ?? 1,
            job_type: job.job_type || 'part-time',
            hr_email: job.hr_email,
            match_score: job.match_score || 0,
            status: 'new',
            match_reasons: job.match_reasons
          };

          const draft = generateColdEmail(fullJobRecord, settings as Partial<AppSettings>);
          const sendRes = await sendEmail(
            env,
            id,
            job.hr_email,
            job.company,
            draft.subject,
            draft.bodyText,
            draft.bodyHtml
          );

          if (sendRes.success) {
            todaySentCount++;
            await env.DB.prepare("UPDATE jobs SET status = 'sent' WHERE id = ?").bind(id).run();
          }
        } catch (autoErr) {
          console.error(`Auto-pilot send failed for job ${id}:`, autoErr);
        }
      }
    }
  }

  // Log activity
  await env.DB.prepare(`
    INSERT INTO activity_logs (type, message, details)
    VALUES (?, ?, ?)
  `).bind(
    'scrape',
    `Cloud scraper run completed: ${allJobs.length} checked, ${newSaved} new matching jobs saved.`,
    JSON.stringify({ totalChecked: allJobs.length, newSaved, sources: ['remoteok', 'remotive', 'jobicy', 'arbeitnow', 'weworkremotely'] })
  ).run();

  return {
    totalScraped: allJobs.length,
    newSaved
  };
}
