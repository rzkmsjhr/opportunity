import { MatchResult } from '../types';

export function evaluateJobCompetency(
  title: string,
  description: string,
  tags: string[] = [],
  location: string = '',
  jobType: string = ''
): MatchResult {
  const fullText = `${title} ${description} ${tags.join(' ')} ${location} ${jobType}`.toLowerCase();
  const titleLower = title.toLowerCase();

  let score = 0;
  const reasons: string[] = [];
  const matchedTags: string[] = [];

  // 1. Remote / WFH Check (Must be Remote or WFH)
  const isExplicitRemote =
    fullText.includes('remote') ||
    fullText.includes('wfh') ||
    fullText.includes('work from home') ||
    fullText.includes('anywhere') ||
    fullText.includes('worldwide') ||
    location.toLowerCase().includes('remote');

  const isStrictlyOnsite =
    (fullText.includes('on-site') || fullText.includes('in-office') || fullText.includes('relocation required')) &&
    !fullText.includes('remote');

  let isRemote = false;
  if (isExplicitRemote && !isStrictlyOnsite) {
    isRemote = true;
    score += 30;
    reasons.push('Remote / WFH verified');
  } else if (!isStrictlyOnsite) {
    // If not strictly on-site, assume partially possible
    score += 10;
  }

  // 2. Part-Time / Flexible Contract Check (ONLY PART TIME requirement)
  const partTimeKeywords = [
    'part-time',
    'part time',
    'parttime',
    'hourly',
    'contract',
    'freelance',
    'flexible hours',
    '10-20 hrs',
    '20 hrs',
    'hours per week',
    'side gig',
    'subcontractor'
  ];

  const fullTimeStrictKeywords = [
    'full-time only',
    'full time only',
    'no contractors',
    'strictly 40 hours',
    '40+ hours per week'
  ];

  let isPartTime = false;
  const matchesPartTime = partTimeKeywords.some(kw => fullText.includes(kw));
  const isStrictFullTime = fullTimeStrictKeywords.some(kw => fullText.includes(kw));

  if (matchesPartTime && !isStrictFullTime) {
    isPartTime = true;
    score += 35;
    reasons.push('Part-time / Flexible Contract verified');
  } else if (jobType.toLowerCase().includes('contract') || jobType.toLowerCase().includes('freelance')) {
    isPartTime = true;
    score += 30;
    reasons.push('Contract / Freelance (Part-time adaptable)');
  } else if (jobType.toLowerCase().includes('part-time') || jobType.toLowerCase().includes('part time')) {
    isPartTime = true;
    score += 35;
    reasons.push('Part-time role');
  } else {
    // If not explicitly part-time, we penalize because user said "ONLY PART TIME"
    score = Math.max(0, score - 20);
  }

  // 3. Technical Competency Matching (Rizki's Profile)
  const competencies = [
    { name: 'Laravel', keywords: ['laravel'], weight: 10 },
    { name: 'PHP', keywords: ['php', 'symfony', 'codeigniter'], weight: 8 },
    { name: 'React', keywords: ['react', 'react.js', 'reactjs', 'next.js', 'nextjs', 'remix'], weight: 10 },
    { name: 'Vue / Nuxt', keywords: ['vue', 'vue.js', 'vuejs', 'nuxt', 'nuxtjs'], weight: 8 },
    { name: 'Angular', keywords: ['angular', 'angularjs'], weight: 6 },
    { name: 'Node.js / TypeScript', keywords: ['node', 'node.js', 'nodejs', 'typescript', 'nest.js', 'express'], weight: 8 },
    { name: 'Python / FastAPI', keywords: ['fastapi', 'python'], weight: 6 },
    { name: 'WordPress', keywords: ['wordpress', 'elementor', 'woocommerce'], weight: 5 },
    { name: 'Fullstack Dev', keywords: ['fullstack', 'full-stack', 'full stack'], weight: 7 },
    { name: 'Frontend Dev', keywords: ['frontend', 'front-end', 'front end'], weight: 6 },
    { name: 'Backend Dev', keywords: ['backend', 'back-end', 'back end'], weight: 6 },
    { name: 'Tech Lead', keywords: ['tech lead', 'team lead', 'lead developer'], weight: 6 }
  ];

  let techScore = 0;
  for (const comp of competencies) {
    const matched = comp.keywords.some(kw => {
      // Word boundary check or simple includes
      const regex = new RegExp(`\\b${kw.replace('.', '\\.')}\\b`, 'i');
      return regex.test(fullText);
    });

    if (matched) {
      techScore += comp.weight;
      matchedTags.push(comp.name);
    }
  }

  // Cap tech score at 35 points
  const cappedTechScore = Math.min(35, techScore);
  score += cappedTechScore;

  if (matchedTags.length > 0) {
    reasons.push(`Matched skills: ${matchedTags.slice(0, 5).join(', ')}`);
  }

  // Title relevance bonus
  if (
    titleLower.includes('fullstack') ||
    titleLower.includes('full-stack') ||
    titleLower.includes('frontend') ||
    titleLower.includes('front-end') ||
    titleLower.includes('backend') ||
    titleLower.includes('back-end') ||
    titleLower.includes('php') ||
    titleLower.includes('laravel') ||
    titleLower.includes('react')
  ) {
    score += 5;
    reasons.push('Title directly matches target specialization');
  }

  // Normalize final score between 0 and 100
  score = Math.min(100, Math.max(0, score));

  return {
    score,
    reasons,
    isPartTime,
    isRemote,
    matchedTags
  };
}
