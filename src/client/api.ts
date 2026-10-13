import { Job, EmailRecord, AppSettings, ActivityLog } from '../types';

const BASE_URL = '/api';

export async function fetchStats() {
  const res = await fetch(`${BASE_URL}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json<{
    totalJobs: number;
    highMatchJobs: number;
    sentEmails: number;
    pendingReview: number;
    partTimeCount: number;
  }>();
}

export async function fetchJobs(params: {
  status?: string;
  minScore?: number;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.minScore) query.set('minScore', String(params.minScore));
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const res = await fetch(`${BASE_URL}/jobs?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return res.json<{
    jobs: Job[];
    total: number;
    page: number;
    limit: number;
  }>();
}

export async function updateJobStatus(id: string, status: string) {
  const res = await fetch(`${BASE_URL}/jobs/${id}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update job status');
  return res.json();
}

export async function triggerScraper() {
  const res = await fetch(`${BASE_URL}/jobs/scrape`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to run scraper');
  return res.json<{
    success: boolean;
    totalScraped: number;
    newSaved: number;
  }>();
}

export async function draftEmail(jobId: string) {
  const res = await fetch(`${BASE_URL}/emails/draft/${jobId}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to draft email');
  return res.json<{
    jobId: string;
    recipientEmail: string;
    recipientName: string;
    subject: string;
    bodyText: string;
    bodyHtml: string;
  }>();
}

export async function sendOutreachEmail(data: {
  jobId?: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
}) {
  const res = await fetch(`${BASE_URL}/emails/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to send email');
  return json;
}

export async function fetchEmails() {
  const res = await fetch(`${BASE_URL}/emails`);
  if (!res.ok) throw new Error('Failed to fetch emails');
  return res.json<{ emails: EmailRecord[] }>();
}

export async function fetchSettings() {
  const res = await fetch(`${BASE_URL}/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json<AppSettings>();
}

export async function saveSettings(settings: Partial<AppSettings>) {
  const res = await fetch(`${BASE_URL}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error('Failed to save settings');
  return res.json();
}

export async function fetchLogs() {
  const res = await fetch(`${BASE_URL}/logs`);
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json<{ logs: ActivityLog[] }>();
}
