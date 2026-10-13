/**
 * Utility to extract HR / Recruiter emails from job descriptions and company domains
 */

const BLACKLISTED_DOMAINS = [
  'example.com',
  'domain.com',
  'sentry.io',
  'github.com',
  'w3.org',
  'cloudflare.com',
  'google.com',
  'apple.com',
  'facebook.com',
  'schema.org'
];

const BLACKLISTED_USERS = [
  'support',
  'help',
  'info',
  'contact',
  'privacy',
  'legal',
  'billing',
  'abuse',
  'noreply',
  'no-reply',
  'press'
];

export function extractHrEmail(description: string = '', companyUrl: string = '', company: string = ''): string | null {
  if (!description && !companyUrl) return null;

  // 1. Regex find all email addresses
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const matches = description.match(emailRegex) || [];

  const candidates: { email: string; priority: number }[] = [];

  for (const rawEmail of matches) {
    const email = rawEmail.toLowerCase().trim();
    const parts = email.split('@');
    if (parts.length !== 2) continue;

    const [user, domain] = parts;

    // Check blacklists
    if (BLACKLISTED_DOMAINS.some(d => domain.includes(d))) continue;

    let priority = 1;

    // High priority HR / hiring keywords
    if (/jobs|careers|hiring|recruiting|talent|hr|apply|join/i.test(user)) {
      priority = 10;
    } else if (BLACKLISTED_USERS.includes(user)) {
      priority = 0;
    }

    if (priority > 0) {
      candidates.push({ email, priority });
    }
  }

  // Sort by highest priority
  candidates.sort((a, b) => b.priority - a.priority);

  if (candidates.length > 0) {
    return candidates[0].email;
  }

  // 2. Fallback heuristic: If company website domain is known, check if careers / jobs email can be formed
  if (companyUrl) {
    try {
      const parsed = new URL(companyUrl.startsWith('http') ? companyUrl : `https://${companyUrl}`);
      const hostname = parsed.hostname.replace(/^www\./, '');
      if (hostname && !BLACKLISTED_DOMAINS.includes(hostname) && hostname.includes('.')) {
        return `careers@${hostname}`;
      }
    } catch {
      // Invalid URL, ignore
    }
  }

  return null;
}
