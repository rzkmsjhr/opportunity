import { Job } from '../../types';
import { evaluateJobCompetency } from '../matcher';
import { extractHrEmail } from '../hr-finder';

export async function scrapeJobicy(): Promise<Partial<Job>[]> {
  const jobs: Partial<Job>[] = [];
  const urls = [
    'https://jobicy.com/api/v2/remote-jobs?count=40&geo=apac',
    'https://jobicy.com/api/v2/remote-jobs?count=40&industry=tech'
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'OpportunityHunter/1.0',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(8000)
      });

      if (!res.ok) {
        console.warn(`Jobicy API returned status ${res.status} for ${url}`);
        continue;
      }

      const data: any = await res.json();
      const items = data.jobs || [];

      for (const item of items) {
        if (!item.jobTitle || !item.companyName) continue;

        const title = item.jobTitle || '';
        const company = item.companyName || '';
        const description = item.jobDescription || item.jobExcerpt || '';
        const location = item.jobGeo || (url.includes('geo=apac') ? 'APAC (Remote)' : 'Remote');
        const jobType = item.jobType || 'part-time';
        const jobUrl = item.url || '';
        const tags: string[] = [];

        const match = evaluateJobCompetency(title, description, tags, location, jobType);
        if (match.score < 40 || !match.isRemote || !match.isPartTime) {
          continue;
        }

        const hrEmail = extractHrEmail(description, '', company) || undefined;

        jobs.push({
          id: `jobicy_${item.id || Math.random().toString(36).substring(7)}`,
          source: 'jobicy',
          external_id: String(item.id || ''),
          title,
          company,
          location,
          is_remote: 1,
          job_type: match.isPartTime ? 'part-time' : jobType,
          url: jobUrl,
          hr_email: hrEmail,
          salary: item.annualSalaryMin ? `$${item.annualSalaryMin} - $${item.annualSalaryMax}` : undefined,
          tags: JSON.stringify(tags),
          description: description.substring(0, 4000),
          match_score: match.score,
          match_reasons: JSON.stringify(match.reasons),
          status: 'new'
        });
      }
    } catch (err) {
      console.error(`Error fetching Jobicy ${url}:`, err);
    }
  }

  return jobs;
}
