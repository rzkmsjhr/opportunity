import { Env } from '../types';

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(
  env: Env,
  jobId: string | null,
  recipientEmail: string,
  recipientName: string = '',
  subject: string,
  bodyText: string,
  bodyHtml: string
): Promise<SendEmailResult> {
  const emailId = `email_${Math.random().toString(36).substring(7)}`;

  // Fetch settings from DB to check for Resend API key if not in env
  let resendApiKey = env.RESEND_API_KEY || '';
  let senderEmail = env.SENDER_EMAIL || 'onboarding@resend.dev';
  let senderName = 'M Rizki Masjahri Putra';

  try {
    const keyRow = await env.DB.prepare("SELECT value FROM settings WHERE key = 'resend_api_key'").first<{ value: string }>();
    if (keyRow?.value) {
      resendApiKey = keyRow.value;
    }

    const senderRow = await env.DB.prepare("SELECT value FROM settings WHERE key = 'sender_email'").first<{ value: string }>();
    if (senderRow?.value) {
      senderEmail = senderRow.value;
    }

    const nameRow = await env.DB.prepare("SELECT value FROM settings WHERE key = 'sender_name'").first<{ value: string }>();
    if (nameRow?.value) {
      senderName = nameRow.value;
    }
  } catch (err) {
    console.warn('Failed to load settings from DB in sendEmail:', err);
  }

  // If no API key configured, record as draft / simulated mode
  if (!resendApiKey) {
    const errorMsg = 'No Resend API Key configured in Settings or Environment. Simulated send recorded.';
    console.warn(errorMsg);

    await env.DB.prepare(`
      INSERT INTO emails (
        id, job_id, recipient_email, recipient_name, subject, 
        body_text, body_html, status, sent_at, provider, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)
    `).bind(
      emailId,
      jobId,
      recipientEmail,
      recipientName,
      subject,
      bodyText,
      bodyHtml,
      'draft',
      'resend',
      'Pending API Key configuration'
    ).run();

    return {
      success: false,
      error: 'Resend API key missing. Please enter your Resend API Key in Settings.'
    };
  }

  try {
    // Send via Resend HTTP API (native Cloudflare Worker fetch)
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${senderName} <${senderEmail}>`,
        to: [recipientEmail],
        subject: subject,
        text: bodyText,
        html: bodyHtml
      })
    });

    const data: any = await res.json();

    if (!res.ok) {
      const errorMsg = data?.message || `Resend returned HTTP ${res.status}`;
      await env.DB.prepare(`
        INSERT INTO emails (
          id, job_id, recipient_email, recipient_name, subject, 
          body_text, body_html, status, provider, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        emailId,
        jobId,
        recipientEmail,
        recipientName,
        subject,
        bodyText,
        bodyHtml,
        'failed',
        'resend',
        errorMsg
      ).run();

      return { success: false, error: errorMsg };
    }

    // Success
    const messageId = data?.id || '';
    await env.DB.prepare(`
      INSERT INTO emails (
        id, job_id, recipient_email, recipient_name, subject, 
        body_text, body_html, status, sent_at, provider, provider_message_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)
    `).bind(
      emailId,
      jobId,
      recipientEmail,
      recipientName,
      subject,
      bodyText,
      bodyHtml,
      'sent',
      'resend',
      messageId
    ).run();

    if (jobId) {
      await env.DB.prepare("UPDATE jobs SET status = 'sent' WHERE id = ?").bind(jobId).run();
    }

    await env.DB.prepare(`
      INSERT INTO activity_logs (type, message, details)
      VALUES (?, ?, ?)
    `).bind(
      'email_send',
      `Sent cold outreach to ${recipientEmail} (${recipientName})`,
      JSON.stringify({ emailId, messageId, subject })
    ).run();

    return { success: true, messageId };
  } catch (err: any) {
    const errorMsg = err?.message || 'Network error sending email';
    return { success: false, error: errorMsg };
  }
}
