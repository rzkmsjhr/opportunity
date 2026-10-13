import { Job } from '../../types';
import { evaluateJobCompetency } from '../matcher';
import { extractHrEmail } from '../hr-finder';

export async function scrapeWeWorkRemotely(): Promise<Partial<Job>[]> {
  const jobs: Partial<Job>[] = [];

  try {
    const res = await fetch('https://weworkremotely.com/categories/remote-programming-jobs.rss', {
      headers: {
        'User-Agent': 'OpportunityHunter/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    });

    if (!res.ok) {
      console.warn(`WWR RSS returned status ${res.status}`);
      return jobs;
    }

    const xml = await res.text();
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];

    for (const itemXml of itemMatches) {
      const getTag = (tag: string) => {
        const m = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
        return m ? m[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1').trim() : '';
      };

      const rawTitle = getTag('title');
      const url = getTag('link') || getTag('guid');
      const description = getTag('description');
      
      if (!rawTitle) continue;

      // WWR titles often formatted as: "Company Name: Job Title"
      let company = 'Tech Company';
      let title = rawTitle;
      if (rawTitle.includes(':')) {
        const parts = rawTitle.split(':');
        company = parts[0].trim();
        title = parts.slice(1).join(':').trim();
      }

      const match = evaluateJobCompetency(title, description, [], 'Remote', 'part-time');
      const hrEmail = extractHrEmail(description, '', company) || undefined;

      const idHash = Math.abs(url.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(36);

      jobs.push({
        id: `wwr_${idHash}`,
        source: 'weworkremotely',
        external_id: idHash,
        title,
        company,
        location: 'Remote',
        is_remote: 1,
        job_type: match.isPartTime ? 'part-time' : 'contract',
        url,
        hr_email: hrEmail,
        description: description.substring(0, 4000),
        match_score: match.score,
        match_reasons: JSON.stringify(match.reasons),
        status: 'new'
      });
    }
  } catch (err) {
    console.error('Error fetching WeWorkRemotely RSS:', err);
  }

  return jobs;
}
