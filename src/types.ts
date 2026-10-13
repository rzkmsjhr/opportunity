export interface Env {
  DB: D1Database;
  ASSETS?: Fetcher;
  ENVIRONMENT?: string;
  LOCAL_SYNC_TOKEN?: string;
  RESEND_API_KEY?: string;
  SENDER_EMAIL?: string;
}

export interface Job {
  id: string;
  source: string;
  external_id?: string;
  title: string;
  company: string;
  company_url?: string;
  location?: string;
  is_remote: number; // 0 or 1
  job_type: string; // 'part-time', 'contract', 'freelance', 'full-time'
  url: string;
  hr_email?: string;
  salary?: string;
  tags?: string;
  description?: string;
  match_score: number;
  match_reasons?: string; // JSON array string
  status: 'new' | 'drafted' | 'sent' | 'ignored' | 'interviewing';
  created_at?: string;
  updated_at?: string;
}

export interface EmailRecord {
  id: string;
  job_id?: string;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  body_text: string;
  body_html?: string;
  status: 'draft' | 'queued' | 'sent' | 'failed';
  sent_at?: string;
  provider?: string;
  provider_message_id?: string;
  error_message?: string;
  created_at?: string;
}

export interface AppSettings {
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  applicant_linkedin: string;
  applicant_github: string;
  applicant_portfolio: string;
  target_roles: string;
  target_stacks: string;
  auto_send_enabled: string;
  auto_send_threshold: string;
  daily_send_limit: string;
  email_provider: string;
  resend_api_key: string;
  sender_email: string;
  sender_name: string;
}

export interface ActivityLog {
  id?: number;
  type: 'scrape' | 'match' | 'email_send' | 'email_draft' | 'sync' | 'system';
  message: string;
  details?: string;
  created_at?: string;
}

export interface MatchResult {
  score: number;
  reasons: string[];
  isPartTime: boolean;
  isRemote: boolean;
  matchedTags: string[];
}
