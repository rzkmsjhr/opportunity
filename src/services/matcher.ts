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

  // 0. Geographic Restriction Check: User is based in Indonesia (GMT+7).
  // "make sure its ok to apply if the candidate are from indonesia gmt +7"
  const isRestrictedNonApac =
    /\b(us only|usa only|u\.s\. only|united states only|north america only|canada only|eu only|europe only|uk only|latam only|must be located in the us|us citizens? only|us residents? only|within us timezones|cet [+-]\d)\b/i.test(fullText) ||
    (/\b(us|usa|united states|canada|uk|europe)\b/i.test(location.toLowerCase()) && !/\b(worldwide|anywhere|global|apac|asia|indonesia)\b/i.test(location.toLowerCase()));

  if (isRestrictedNonApac) {
    return {
      score: 0,
      reasons: ['Skipped: Geographically restricted (US/EU only, not open to Indonesia / GMT+7)'],
      isPartTime: false,
      isRemote: false,
      matchedTags: []
    };
  }

  // 1. Remote / WFH Check (Must be Remote or WFH)
  const isExplicitRemote =
    fullText.includes('remote') ||
    fullText.includes('wfh') ||
    fullText.includes('work from home') ||
    fullText.includes('anywhere') ||
    fullText.includes('worldwide') ||
    fullText.includes('telecommute') ||
    location.toLowerCase().includes('remote');

  const isStrictlyOnsite =
    (fullText.includes('on-site') || fullText.includes('in-office') || fullText.includes('relocation required') || fullText.includes('wfo only')) &&
    !fullText.includes('remote') && !fullText.includes('wfh');

  let isRemote = false;
  if (isExplicitRemote && !isStrictlyOnsite) {
    isRemote = true;
    score += 25;
    reasons.push('Remote / WFH verified');
  } else if (!isStrictlyOnsite) {
    // If not strictly on-site, assume partially possible
    score += 10;
  }

  // 1b. Location & Timezone Check: APAC / ASEAN / Indonesia vs Worldwide
  const apacKeywords = [
    'indonesia', 'jakarta', 'surabaya', 'malang', 'bandung', 'bali', 'yogyakarta',
    'singapore', 'malaysia', 'kuala lumpur', 'philippines', 'manila', 'vietnam', 'thailand', 'bangkok',
    'australia', 'sydney', 'melbourne', 'new zealand', 'japan', 'tokyo', 'korea', 'seoul', 'hong kong', 'taiwan',
    'apac', 'asia-pacific', 'asia pacific', 'asia', 'asean', 'southeast asia', 'sea',
    'gmt+7', 'utc+7', 'gmt+8', 'utc+8', 'gmt+9', 'wib', 'ict', 'aest', 'jst',
    'any timezone', 'flexible timezone', 'timezone agnostic'
  ];

  const isApacAligned = apacKeywords.some(kw => fullText.includes(kw) || location.toLowerCase().includes(kw));

  const isWorldwide =
    /\b(worldwide|anywhere|global|work from anywhere|remote worldwide|all locations)\b/i.test(fullText) ||
    /\b(worldwide|anywhere|global)\b/i.test(location.toLowerCase());

  if (isApacAligned) {
    score += 20;
    reasons.push('APAC / ASEAN Timezone aligned (GMT+7 friendly)');
  } else if (isWorldwide) {
    score += 15;
    reasons.push('Worldwide Remote (Open to candidates in Indonesia)');
  }

  // 2. Part-Time / Flexible Contract Check (ONLY PART TIME requirement)
  const partTimeKeywords = [
    'part-time',
    'part time',
    'parttime',
    'paruh waktu',
    'hourly',
    'contract',
    'freelance',
    'lepas',
    'project-based',
    'proyek',
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

  // 4. Shopify Filter: User does not do Shopify
  // "its still returning shopify opportunity, i dont do shopify, its ok if its mixed with technology i have experinced, but if its not, skip it"
  const hasShopifyInTitle = /\bshopify\b/i.test(title);
  const hasShopifyInText = /\bshopify\b/i.test(fullText);

  if (hasShopifyInText) {
    const isShopifyJobTitle =
      hasShopifyInTitle && !/\b(laravel|symfony|codeigniter)\b/i.test(titleLower);

    const experiencedTechStacks = matchedTags.filter(
      t => !['Tech Lead', 'Fullstack Dev', 'Frontend Dev', 'Backend Dev'].includes(t)
    );

    // If the title designates it as a Shopify role, skip completely
    if (isShopifyJobTitle) {
      return {
        score: 0,
        reasons: ['Skipped: Dedicated Shopify opportunity (user does not do Shopify)'],
        isPartTime: false,
        isRemote: false,
        matchedTags: []
      };
    }

    // If Shopify is mentioned, but NO core experienced tech stacks are present, skip it
    if (experiencedTechStacks.length === 0) {
      return {
        score: 0,
        reasons: ['Skipped: Shopify role without core experienced technology (Laravel/PHP/React/Vue/Node)'],
        isPartTime: false,
        isRemote: false,
        matchedTags: []
      };
    }
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
