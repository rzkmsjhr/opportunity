import { Job } from '../../types';
import { evaluateJobCompetency } from '../matcher';
import { extractHrEmail } from '../hr-finder';

export async function scrapeRemoteOk(): Promise<Partial<Job>[]> {
  const jobs: Partial<Job>[] = [];

  try {
    const res = await fetch('https://remoteok.com/api', {
      headers: {
        'User-Agent': 'OpportunityHunter/1.0 (Mozilla/5.0 AppleWebKit/537.36)',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      console.warn(`RemoteOK API returned status ${res.status}`);
      return jobs;
    }

    const data: any = await res.json();
    if (!Array.isArray(data)) return jobs;

    // First item is usually legal disclaimer/meta object
    const items = data.slice(1);

    for (const item of items) {
      if (!item.position || !item.company) continue;

      const title = item.position || '';
      const company = item.company || '';
      const description = item.description || '';
      const tags = Array.isArray(item.tags) ? item.tags : [];
      const location = item.location || 'Remote';
      const jobUrl = item.url || (item.id ? `https://remoteok.com/remote-jobs/${item.id}` : '');
      const salary = item.salary || '';

      const match = evaluateJobCompetency(title, description, tags, location, 'remote');
      const hrEmail = extractHrEmail(description, item.company_url || '', company) || undefined;

      jobs.push({
        id: `remoteok_${item.id || Math.random().toString(36).substring(7)}`,
        source: 'remoteok',
        external_id: String(item.id || ''),
        title,
        company,
        company_url: item.company_url || undefined,
        location,
        is_remote: match.isRemote ? 1 : 1,
        job_type: match.isPartTime ? 'part-time' : 'contract',
        url: jobUrl,
        hr_email: hrEmail,
        salary: salary || undefined,
        tags: JSON.stringify(tags),
        description: description.substring(0, 4000), // sanitize size for D1
        match_score: match.score,
        match_reasons: JSON.stringify(match.reasons),
        status: 'new'
      });
    }
  } catch (err) {
    console.error('Error fetching RemoteOK:', err);
  }

  return jobs;
}
