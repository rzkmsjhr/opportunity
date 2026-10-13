import { Job, AppSettings } from '../types';

export interface GeneratedEmail {
  subject: string;
  bodyText: string;
  bodyHtml: string;
}

export function generateColdEmail(job: Job, settings: Partial<AppSettings> = {}): GeneratedEmail {
  const applicantName = settings.applicant_name || 'M Rizki Masjahri Putra';
  const applicantEmail = settings.applicant_email || 'mrmp.rizki@gmail.com';
  const applicantPhone = settings.applicant_phone || '+62 821 4166 4133';
  const applicantLinkedin = settings.applicant_linkedin || 'https://www.linkedin.com/in/rizki-masjahri-244b24101/';
  const applicantGithub = settings.applicant_github || 'https://github.com/rzkmsjhr';

  const jobTitle = job.title;
  const company = job.company;

  // Extract matching skills from tags
  let stackSummary = 'PHP (Laravel), Modern JavaScript/TypeScript (React, Node.js, Vue), and API integrations';
  if (job.match_reasons) {
    try {
      const reasons = JSON.parse(job.match_reasons) as string[];
      const skillReason = reasons.find(r => r.startsWith('Matched skills:'));
      if (skillReason) {
        stackSummary = skillReason.replace('Matched skills: ', '');
      }
    } catch {
      // ignore
    }
  }

  const subject = `Application: ${jobTitle} (Part-Time Remote) - ${applicantName}`;

  const bodyText = `Hi ${company} Hiring Team,

I came across your open ${jobTitle} role and wanted to reach out directly. I am an experienced Fullstack Developer with 6+ years of hands-on expertise specializing in ${stackSummary}.

I am specifically looking for a Remote Part-Time (or flexible contract, ~15–25 hrs/week) engagement where I can hit the ground running and immediately add value to your product and team.

Key highlights of what I bring:
• Core Fullstack Engineering: Deep experience across PHP (Laravel, Symfony) and modern JavaScript (React/Next.js/Remix, Vue/Nuxt, Node.js, Angular, TypeScript).
• International Team Experience: Fluent English speaker with extensive experience collaborating remotely with distributed teams across Australia, Netherlands, the UK, and Singapore.
• Technical Leadership & Autonomy: Proven track record as a Tech Lead guiding architecture, unblocking complex bugs, and delivering reliable software under agile workflows.
• Automation & AI: Practical experience building workflow automations (n8n) and integrating multi-modal AI agents.

Selected Live Portfolios & Work Samples:
• Kaya Web Application (Svelte/Full App): https://kaya-app.netlify.app/
• DeskTeam Landing Page Framework: https://deskteam-html-test.netlify.app/
• Seakom Product Showcase: https://seakom.netlify.app/en/home
• GitHub Profile: ${applicantGithub}
• LinkedIn Profile: ${applicantLinkedin}

I would welcome the opportunity to discuss how I can contribute to ${company}'s goals on a part-time basis. Are you available for a brief 10-minute chat this week?

Warm regards,

${applicantName}
Email: ${applicantEmail}
Phone/WhatsApp: ${applicantPhone}
GitHub: ${applicantGithub}
LinkedIn: ${applicantLinkedin}
`;

  const bodyHtml = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1e293b;">
  <p>Hi <strong>${company}</strong> Hiring Team,</p>

  <p>I came across your open <strong>${jobTitle}</strong> role and wanted to reach out directly. I am an experienced Fullstack Developer with 6+ years of hands-on expertise specializing in <strong>${stackSummary}</strong>.</p>

  <p>I am specifically looking for a <strong>Remote Part-Time</strong> (or flexible contract, ~15–25 hrs/week) engagement where I can hit the ground running and immediately add value to your product and team.</p>

  <p><strong>Key highlights of what I bring:</strong></p>
  <ul>
    <li><strong>Core Fullstack Engineering:</strong> Deep experience across PHP (Laravel, Symfony) and modern JavaScript (React/Next.js/Remix, Vue/Nuxt, Node.js, Angular, TypeScript).</li>
    <li><strong>International Team Experience:</strong> Fluent English speaker with extensive experience collaborating remotely with distributed teams across Australia, Netherlands, the UK, and Singapore.</li>
    <li><strong>Technical Leadership & Autonomy:</strong> Proven track record as a Tech Lead guiding architecture, unblocking complex bugs, and delivering reliable software under agile workflows.</li>
    <li><strong>Automation & AI:</strong> Practical experience building workflow automations (n8n) and integrating multi-modal AI agents.</li>
  </ul>

  <p><strong>Selected Live Portfolios & Work Samples:</strong></p>
  <ul>
    <li><a href="https://kaya-app.netlify.app/" target="_blank" style="color: #2563eb;">Kaya Web Application (Svelte/Full App)</a></li>
    <li><a href="https://deskteam-html-test.netlify.app/" target="_blank" style="color: #2563eb;">DeskTeam Landing Page Framework</a></li>
    <li><a href="https://seakom.netlify.app/en/home" target="_blank" style="color: #2563eb;">Seakom Product Showcase</a></li>
    <li><a href="${applicantGithub}" target="_blank" style="color: #2563eb;">GitHub: ${applicantGithub}</a></li>
    <li><a href="${applicantLinkedin}" target="_blank" style="color: #2563eb;">LinkedIn Profile</a></li>
  </ul>

  <p>I would welcome the opportunity to discuss how I can contribute to <strong>${company}</strong>'s goals on a part-time basis. Are you available for a brief 10-minute chat this week?</p>

  <p style="margin-top: 24px;">Warm regards,</p>
  <p>
    <strong>${applicantName}</strong><br/>
    📧 <a href="mailto:${applicantEmail}" style="color: #2563eb;">${applicantEmail}</a><br/>
    📱 ${applicantPhone}<br/>
    🔗 <a href="${applicantLinkedin}" target="_blank" style="color: #2563eb;">LinkedIn</a> | <a href="${applicantGithub}" target="_blank" style="color: #2563eb;">GitHub</a>
  </p>
</div>
  `.trim();

  return {
    subject,
    bodyText,
    bodyHtml
  };
}
