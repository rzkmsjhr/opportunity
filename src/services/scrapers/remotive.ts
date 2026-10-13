import { Job } from '../../types';
import { evaluateJobCompetency } from '../matcher';
import { extractHrEmail } from '../hr-finder';

export async function scrapeRemotive(): Promise<Partial<Job>[]> {
  const jobs: Partial<Job>[] = [];

  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&limit=40', {
      headers: {
        'User-Agent': 'OpportunityHunter/1.0',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      console.warn(`Remotive API returned status ${res.status}`);
      return jobs;
    }

    const data: any = await res.json();
    const items = data.jobs || [];

    for (const item of items) {
      if (!item.title || !item.company_name) continue;

      const title = item.title || '';
      const company = item.company_name || '';
      const description = item.description || '';
      const tags = Array.isArray(item.tags) ? item.tags : [];
      const location = item.candidate_required_location || 'Remote';
      const jobType = item.job_type || 'part-time';
      const jobUrl = item.url || '';
      const salary = item.salary || '';

      const match = evaluateJobCompetency(title, description, tags, location, jobType);
      const hrEmail = extractHrEmail(description, '', company) || undefined;

      jobs.push({
        id: `remotive_${item.id || Math.random().toString(36).substring(7)}`,
        source: 'remotive',
        external_id: String(item.id || ''),
        title,
        company,
        location,
        is_remote: 1,
        job_type: match.isPartTime ? 'part-time' : (jobType || 'contract'),
        url: jobUrl,
        hr_email: hrEmail,
        salary: salary || undefined,
        tags: JSON.stringify(tags),
        description: description.substring(0, 4000),
        match_score: match.score,
        match_reasons: JSON.stringify(match.reasons),
        status: 'new'
      });
    }
  } catch (err) {
    console.error('Error fetching Remotive:', err);
  }

  return jobs;
}
