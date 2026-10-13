-- Schema for Opportunity Job Hunter (Cloudflare D1 / SQLite)

CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    external_id TEXT,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    company_url TEXT,
    location TEXT,
    is_remote INTEGER DEFAULT 1,
    job_type TEXT DEFAULT 'part-time',
    url TEXT NOT NULL,
    hr_email TEXT,
    salary TEXT,
    tags TEXT,
    description TEXT,
    match_score INTEGER DEFAULT 0,
    match_reasons TEXT,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_match_score ON jobs(match_score);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);

CREATE TABLE IF NOT EXISTS emails (
    id TEXT PRIMARY KEY,
    job_id TEXT,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT NOT NULL,
    body_text TEXT NOT NULL,
    body_html TEXT,
    status TEXT DEFAULT 'draft',
    sent_at DATETIME,
    provider TEXT DEFAULT 'resend',
    provider_message_id TEXT,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_emails_job_id ON emails(job_id);
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial settings
INSERT OR IGNORE INTO settings (key, value) VALUES 
('applicant_name', 'M Rizki Masjahri Putra'),
('applicant_email', 'mrmp.rizki@gmail.com'),
('applicant_phone', '+62 821 4166 4133'),
('applicant_linkedin', 'https://www.linkedin.com/in/rizki-masjahri-244b24101/'),
('applicant_github', 'https://github.com/rzkmsjhr'),
('applicant_portfolio', 'https://deskteam-html-test.netlify.app/, https://kaya-app.netlify.app/'),
('target_roles', 'Fullstack Developer, Frontend Developer, Backend Developer, Tech Lead'),
('target_stacks', 'PHP, Laravel, Symfony, React, Next.js, Remix, Vue, Nuxt, Angular, Node.js, TypeScript, Python, FastAPI'),
('auto_send_enabled', 'false'),
('auto_send_threshold', '85'),
('daily_send_limit', '15'),
('email_provider', 'resend'),
('resend_api_key', ''),
('sender_email', 'mrmp.rizki@gmail.com'),
('sender_name', 'M Rizki Masjahri Putra');
