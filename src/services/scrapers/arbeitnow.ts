import { Job } from '../../types';
import { evaluateJobCompetency } from '../matcher';
import { extractHrEmail } from '../hr-finder';

export async function scrapeArbeitnow(): Promise<Partial<Job>[]> {
  const jobs: Partial<Job>[] = [];

  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
      headers: {
        'User-Agent': 'OpportunityHunter/1.0',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      console.warn(`Arbeitnow API returned status ${res.status}`);
      return jobs;
    }

    const data: any = await res.json();
    const items = data.data || [];

    for (const item of items) {
      if (!item.title || !item.company_name) continue;

      const title = item.title || '';
      const company = item.company_name || '';
      const description = item.description || '';
      // Arbeitnow must explicitly declare remote: true
      if (!item.remote) continue;

      const location = item.location ? `${item.location} (Remote)` : 'Remote';
      const jobTypes = Array.isArray(item.job_types) ? item.job_types.join(', ') : 'part-time';
      const jobUrl = item.url || '';

      const match = evaluateJobCompetency(title, description, tags, location, jobTypes);
      if (match.score < 40 || !match.isRemote || !match.isPartTime) {
        continue;
      }

      const hrEmail = extractHrEmail(description, '', company) || undefined;

      jobs.push({
        id: `arbeitnow_${item.slug || Math.random().toString(36).substring(7)}`,
        source: 'arbeitnow',
        external_id: item.slug || '',
        title,
        company,
        location,
        is_remote: 1,
        job_type: match.isPartTime ? 'part-time' : jobTypes,
        url: jobUrl,
        hr_email: hrEmail,
        tags: JSON.stringify(tags),
        description: description.substring(0, 4000),
        match_score: match.score,
        match_reasons: JSON.stringify(match.reasons),
        status: 'new'
      });
    }
  } catch (err) {
    console.error('Error fetching Arbeitnow:', err);
  }

  return jobs;
}
