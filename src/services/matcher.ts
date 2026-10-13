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

  // 1. Strict On-Site / Office Exclusion
  // "this is not remote opportunities, fix the scrapper"
  const isOnsiteStrict =
    /\b(kerja di lokasi|kerja di kantor|penempatan di kantor|wfo|work from office|work in office|onsite|on-site|in-office|in office|wfo strictly|hybrid|wfo south jakarta|wfo jakarta|onsite only|on-site only|penempatan di)\b/i.test(fullText);

  // 2. Strict Remote / WFH Verification (Must be explicitly remote/wfh)
  const isExplicitRemote =
    /\b(remote|wfh|work from home|kerja dari rumah|kerja jarak jauh|telecommute|work from anywhere|anywhere|worldwide)\b/i.test(fullText) ||
    /\b(remote|wfh|worldwide|anywhere)\b/i.test(location.toLowerCase());

  if (isOnsiteStrict || !isExplicitRemote) {
    return {
      score: 0,
      reasons: ['Skipped: Not a remote/WFH opportunity (requires on-site or office presence)'],
      isPartTime: false,
      isRemote: false,
      matchedTags: []
    };
  }

  score += 30;
  reasons.push('Remote / WFH verified');
  const isRemote = true;

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
    score += 15;
    reasons.push('APAC / ASEAN Timezone aligned (GMT+7 friendly)');
  } else if (isWorldwide) {
    score += 10;
    reasons.push('Worldwide Remote (Open to candidates in Indonesia)');
  }

  // 2. Strict Part-Time / Flexible Contract Verification
  // "ONLY PART TIME, IT field, Fullstack, Frontend, Backend devs"
  const isStrictFullTime =
    /\b(penuh waktu|full-time only|full time only|strictly full-time|no contractors|strictly 40 hours|40\+ hours per week)\b/i.test(fullText);

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

  const matchesPartTime = partTimeKeywords.some(kw => fullText.includes(kw));
  const isContractOrFreelance = jobType.toLowerCase().includes('contract') || jobType.toLowerCase().includes('freelance') || jobType.toLowerCase().includes('part-time');

  let isPartTime = false;
  if (isStrictFullTime && !matchesPartTime) {
    return {
      score: 0,
      reasons: ['Skipped: Strictly full-time only (user requires ONLY PART TIME)'],
      isPartTime: false,
      isRemote: true,
      matchedTags: []
    };
  }

  if (matchesPartTime) {
    isPartTime = true;
    score += 25;
    reasons.push('Part-time / Flexible Contract verified');
  } else if (isContractOrFreelance) {
    isPartTime = true;
    score += 20;
    reasons.push('Contract / Freelance (Part-time adaptable)');
  } else {
    // If not verified part-time or flexible contract, skip it
    return {
      score: 0,
      reasons: ['Skipped: Not verified as part-time or flexible contract (user requires ONLY PART TIME)'],
      isPartTime: false,
      isRemote: true,
      matchedTags: []
    };
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
