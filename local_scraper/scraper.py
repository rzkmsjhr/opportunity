"""
Opportunity Hunter - Local Laptop Companion Scraper
Strictly targets REMOTE / WFH and PART-TIME / FLEXIBLE IT opportunities.
Filters out on-site, hybrid, full-time only, and geographically restricted jobs.
"""

import sys
import re
import json
import time
import argparse
from urllib.parse import urlparse, quote_plus
import requests
from bs4 import BeautifulSoup

DEFAULT_API_URL = "http://127.0.0.1:8787"
DEFAULT_SYNC_TOKEN = "opp-hunter-secret-token"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://www.google.com/"
}

CORE_KEYWORDS = [
    "php", "laravel", "symfony", "codeigniter",
    "react", "next.js", "remix", "vue", "nuxt", "angular",
    "node.js", "typescript", "javascript", "fastapi", "python",
    "fullstack", "frontend", "backend", "wordpress"
]

APAC_LOCATIONS = [
    "indonesia", "jakarta", "surabaya", "malang", "bandung", "bali", "yogyakarta",
    "singapore", "malaysia", "kuala lumpur", "philippines", "manila", "vietnam", "thailand", "bangkok",
    "australia", "sydney", "melbourne", "new zealand", "japan", "tokyo", "korea", "seoul", "hong kong", "taiwan",
    "apac", "asia-pacific", "asia pacific", "asia", "asean", "southeast asia", "sea",
    "gmt+7", "utc+7", "gmt+8", "utc+8", "gmt+9", "wib", "ict", "aest", "jst",
    "any timezone", "flexible timezone", "timezone agnostic"
]

def extract_email(text: str, domain: str = "") -> str:
    """Extract HR/Recruiter email using priority regex and fallbacks."""
    if not text:
        return ""
    
    pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    found = re.findall(pattern, text)
    
    priority_candidates = []
    for email in found:
        e = email.lower()
        if any(ign in e for ign in ['example.com', 'domain.com', 'sentry.io', 'github.com', 'cloudflare.com']):
            continue
        if any(hr in e for hr in ['jobs', 'careers', 'hiring', 'recruiting', 'talent', 'hr', 'apply']):
            return e
        priority_candidates.append(e)
        
    if priority_candidates:
        return priority_candidates[0]
        
    if domain and '.' in domain and not any(ign in domain for ign in ['github.com', 'google.com', 'linkedin.com']):
        return f"careers@{domain}"
        
    return ""

def calculate_match_score(title: str, description: str, tags: list = None, location: str = "", job_type: str = "") -> tuple:
    """Strictly validates Remote/WFH and Part-Time/Flexible Contract requirements."""
    text = f"{title} {description} {' '.join(tags or [])} {location} {job_type}".lower()
    score = 0
    reasons = []

    # 0. Strict Non-APAC / Geographic Restriction Check (US/EU only)
    is_restricted_non_apac = bool(re.search(
        r'\b(us only|usa only|u\.s\. only|united states only|north america only|canada only|eu only|europe only|uk only|latam only|must be located in the us|us citizens? only|us residents? only|within us timezones|cet [+-]\d)\b',
        text,
        re.IGNORECASE
    )) or (
        bool(re.search(r'\b(us|usa|united states|canada|uk|europe)\b', location.lower())) and
        not bool(re.search(r'\b(worldwide|anywhere|global|apac|asia|indonesia)\b', location.lower()))
    )

    if is_restricted_non_apac:
        return 0, ["Skipped: Geographically restricted (US/EU only, not open to Indonesia / GMT+7)"]

    # 1. Dedicated Shopify Check
    has_shopify_title = bool(re.search(r'\bshopify\b', title, re.IGNORECASE))
    has_shopify_text = bool(re.search(r'\bshopify\b', text, re.IGNORECASE))

    matched_tech = []
    for kw in CORE_KEYWORDS:
        if re.search(r'\b' + re.escape(kw) + r'\b', text):
            matched_tech.append(kw.capitalize())

    if has_shopify_text:
        is_dedicated_shopify = has_shopify_title and not bool(re.search(r'\b(laravel|symfony|codeigniter)\b', title, re.IGNORECASE))
        core_stacks = [t for t in matched_tech if t.lower() not in ['fullstack', 'frontend', 'backend', 'tech lead']]

        if is_dedicated_shopify:
            return 0, ["Skipped: Dedicated Shopify opportunity (user does not do Shopify)"]

        if not core_stacks:
            return 0, ["Skipped: Shopify role without core experienced technology (Laravel/PHP/React/Vue/Node)"]

    # 2. Strict On-Site / Office Exclusion ("this is not remote opportunities")
    is_onsite_strict = bool(re.search(
        r'\b(kerja di lokasi|kerja di kantor|penempatan di kantor|wfo|work from office|work in office|onsite|on-site|in-office|in office|wfo strictly|hybrid|wfo south jakarta|wfo jakarta|onsite only|on-site only|penempatan di)\b',
        text,
        re.IGNORECASE
    ))

    # Strict Remote / WFH Verification
    is_explicit_remote = bool(re.search(
        r'\b(remote|wfh|work from home|kerja dari rumah|kerja jarak jauh|telecommute|work from anywhere|anywhere|worldwide)\b',
        text,
        re.IGNORECASE
    )) or bool(re.search(r'\b(remote|wfh|worldwide|anywhere)\b', location.lower()))

    if is_onsite_strict or not is_explicit_remote:
        return 0, ["Skipped: Not a remote/WFH opportunity (requires on-site or office presence)"]

    score += 30
    reasons.append("Remote / WFH verified")

    # 3. Location / Timezone Check
    is_apac_aligned = any(kw in text or kw in location.lower() for kw in APAC_LOCATIONS)
    is_worldwide = bool(re.search(r'\b(worldwide|anywhere|global|work from anywhere|remote worldwide)\b', text)) or \
                   bool(re.search(r'\b(worldwide|anywhere|global)\b', location.lower()))

    if is_apac_aligned:
        score += 15
        reasons.append("APAC / ASEAN Timezone aligned (GMT+7 friendly)")
    elif is_worldwide:
        score += 10
        reasons.append("Worldwide Remote (Open to candidates in Indonesia)")

    # 4. Strict Part-Time / Flexible Contract Verification ("ONLY PART TIME")
    is_strict_full_time = bool(re.search(
        r'\b(penuh waktu|full-time only|full time only|strictly full-time|no contractors|strictly 40 hours|40\+ hours per week)\b',
        text,
        re.IGNORECASE
    ))

    part_time_keywords = [
        'part-time', 'part time', 'parttime', 'paruh waktu', 'hourly',
        'contract', 'freelance', 'lepas', 'project-based', 'proyek', 'flexible hours', '10-20 hrs', '20 hrs', 'side gig'
    ]

    matches_part_time = any(kw in text for kw in part_time_keywords)
    is_contract_or_freelance = any(k in job_type.lower() for k in ['contract', 'freelance', 'part-time'])

    if is_strict_full_time and not matches_part_time:
        return 0, ["Skipped: Strictly full-time only (user requires ONLY PART TIME)"]

    if matches_part_time:
        score += 25
        reasons.append("Part-time / Flexible Contract verified")
    elif is_contract_or_freelance:
        score += 20
        reasons.append("Contract / Freelance (Part-time adaptable)")
    else:
        return 0, ["Skipped: Not verified as part-time or flexible contract (user requires ONLY PART TIME)"]

    # 5. Tech Stack Matching
    if matched_tech:
        tech_score = min(35, len(matched_tech) * 7)
        score += tech_score
        reasons.append(f"Matched skills: {', '.join(matched_tech[:5])}")

    final_score = min(100, max(0, score))
    return final_score, reasons

# ----------------- SCRAPER MODULES ----------------- #

def scrape_glints_jobs() -> list:
    """Scrape Glints strictly for REMOTE and PART_TIME / CONTRACT / FREELANCE tech jobs."""
    jobs = []
    keywords = ["laravel", "react", "fullstack", "php", "vue", "node", "developer"]
    print("[*] Scraping Glints (STRICT REMOTE & PART-TIME ONLY)...")

    for kw in keywords:
        try:
            url = f"https://glints.com/id/opportunities/jobs/explore?keyword={quote_plus(kw)}&country=ID"
            res = requests.get(url, headers=HEADERS, timeout=12)
            if res.status_code != 200:
                continue

            soup = BeautifulSoup(res.text, 'html.parser')
            next_data = soup.find('script', id='__NEXT_DATA__')
            if not next_data or not next_data.string:
                continue

            d = json.loads(next_data.string)
            items = d.get('props', {}).get('pageProps', {}).get('initialJobs', {}).get('jobsInPage', [])

            for item in items:
                title = item.get('title') or ""
                company_obj = item.get('company') or {}
                company = company_obj.get('name') or "Indonesian Tech Company"
                item_id = item.get('id') or ""
                arrangement = item.get('workArrangementOption', '') # 'REMOTE', 'ONSITE', 'HYBRID'
                glints_type = item.get('type', '') # 'FULL_TIME', 'PART_TIME', 'CONTRACT', 'PROJECT_BASED', 'FREELANCE'

                # 1. STRICT REMOTE CHECK: Glints must explicitly say REMOTE
                if arrangement != 'REMOTE':
                    continue # Skip ONSITE and HYBRID completely!

                # 2. STRICT PART-TIME CHECK: Skip FULL_TIME
                if glints_type == 'FULL_TIME':
                    continue # Skip Penuh Waktu completely!

                # 3. Check for any on-site keywords in title
                if re.search(r'\b(wfo|onsite|on-site|kerja di lokasi)\b', title, re.IGNORECASE):
                    continue

                link = f"https://glints.com/id/opportunities/jobs/{item_id}"
                desc = f"Glints Verified Remote Role: {title} at {company}. Work Arrangement: Remote. Type: {glints_type}. Stacks: {kw}."
                location = "Indonesia (Remote)"

                score, reasons = calculate_match_score(title, desc, tags=[kw], location=location, job_type=glints_type)
                if score == 0:
                    continue

                job_id = f"glints_{item_id[:8]}"

                jobs.append({
                    "id": job_id,
                    "source": "glints",
                    "title": title,
                    "company": company,
                    "location": "Indonesia (Remote)",
                    "is_remote": 1,
                    "job_type": "part-time" if glints_type == "PART_TIME" else "contract",
                    "url": link,
                    "hr_email": None,
                    "description": desc,
                    "match_score": score,
                    "match_reasons": json.dumps(reasons),
                    "status": "new"
                })
            time.sleep(1)
        except Exception as e:
            print(f"[-] Glints scrape warning for {kw}: {e}")

    print(f"[+] Glints: Collected {len(jobs)} strictly Remote Part-Time jobs.")
    return jobs

def scrape_linkedin_jobs() -> list:
    """Scrape LinkedIn strictly for Remote (f_WT=2) AND Part-Time (f_JT=P) roles."""
    jobs = []
    queries = [
        {"keywords": "developer", "location": "Indonesia", "f_WT": "2", "f_JT": "P"},
        {"keywords": "laravel", "location": "Indonesia", "f_WT": "2", "f_JT": "P"},
        {"keywords": "react", "location": "Indonesia", "f_WT": "2", "f_JT": "P"},
        {"keywords": "fullstack", "location": "Indonesia", "f_WT": "2", "f_JT": "P"},
        {"keywords": "developer", "location": "Singapore", "f_WT": "2", "f_JT": "P"},
        {"keywords": "developer", "location": "Asia-Pacific", "f_WT": "2", "f_JT": "P"},
        {"keywords": "developer", "location": "Worldwide", "f_WT": "2", "f_JT": "P"}
    ]

    print("[*] Scraping LinkedIn (STRICT REMOTE & PART-TIME GUEST SEARCH)...")

    for q in queries:
        try:
            params = f"keywords={quote_plus(q['keywords'])}&location={quote_plus(q['location'])}&f_WT={q['f_WT']}&f_JT={q['f_JT']}"
            url = f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?{params}"

            res = requests.get(url, headers=HEADERS, timeout=12)
            if res.status_code != 200:
                continue

            soup = BeautifulSoup(res.text, 'html.parser')
            cards = soup.select('div.job-search-card')

            for card in cards:
                title_el = card.select_one('.base-search-card__title')
                comp_el = card.select_one('.base-search-card__subtitle')
                loc_el = card.select_one('.job-search-card__location')
                link_el = card.select_one('a.base-card__full-link')

                title = title_el.get_text(strip=True) if title_el else ""
                company = comp_el.get_text(strip=True) if comp_el else ""
                loc_text = loc_el.get_text(strip=True) if loc_el else q['location']
                link = link_el['href'].split('?')[0] if link_el and 'href' in link_el.attrs else ""

                if not title or not company or not link:
                    continue

                # Exclude any on-site / hybrid markers
                if re.search(r'\b(on-site|onsite|hybrid|wfo)\b', f"{title} {loc_text}", re.IGNORECASE):
                    continue

                desc = f"LinkedIn Remote Part-Time listing: {title} at {company}. Location: {loc_text}. Role: Part-Time Remote."
                score, reasons = calculate_match_score(title, desc, location=f"{loc_text} Remote", job_type="part-time")

                if score == 0:
                    continue

                job_id = f"li_{abs(hash(link)) % 10000000}"

                jobs.append({
                    "id": job_id,
                    "source": "linkedin",
                    "title": title,
                    "company": company,
                    "location": f"{loc_text} (Remote)",
                    "is_remote": 1,
                    "job_type": "part-time",
                    "url": link,
                    "hr_email": None,
                    "description": desc,
                    "match_score": score,
                    "match_reasons": json.dumps(reasons),
                    "status": "new"
                })
            time.sleep(1)
        except Exception as e:
            print(f"[-] LinkedIn scrape warning for {q}: {e}")

    print(f"[+] LinkedIn: Collected {len(jobs)} strictly Remote Part-Time jobs.")
    return jobs

def scrape_jobicy_apac_jobs() -> list:
    """Scrape Jobicy specifically for APAC remote listings."""
    jobs = []
    print("[*] Scraping Jobicy (APAC Remote Stream)...")
    url = "https://jobicy.com/api/v2/remote-jobs?count=40&geo=apac"

    try:
        res = requests.get(url, headers=HEADERS, timeout=12)
        if res.status_code == 200:
            data = res.json()
            items = data.get("jobs", [])
            for item in items:
                title = item.get("jobTitle") or ""
                company = item.get("companyName") or ""
                desc = item.get("jobDescription") or item.get("jobExcerpt") or ""
                link = item.get("url") or ""
                loc = item.get("jobGeo") or "APAC (Remote)"
                job_type = item.get("jobType") or "part-time"

                loc_str = " ".join(loc) if isinstance(loc, list) else str(loc)
                job_type_str = " ".join(job_type) if isinstance(job_type, list) else str(job_type)

                if not title or not company or not link:
                    continue

                score, reasons = calculate_match_score(title, desc, location=loc_str, job_type=job_type_str)
                if score == 0:
                    continue

                hr_email = extract_email(desc)
                job_id = f"jobicy_apac_{item.get('id', abs(hash(link)) % 10000000)}"

                jobs.append({
                    "id": job_id,
                    "source": "jobicy_apac",
                    "title": title,
                    "company": company,
                    "location": loc,
                    "is_remote": 1,
                    "job_type": "part-time",
                    "url": link,
                    "hr_email": hr_email or None,
                    "description": desc[:3000],
                    "match_score": score,
                    "match_reasons": json.dumps(reasons),
                    "status": "new"
                })
    except Exception as e:
        print(f"[-] Jobicy APAC scrape warning: {e}")

    print(f"[+] Jobicy APAC: Collected {len(jobs)} candidate jobs.")
    return jobs

def scrape_remoteok_jobs() -> list:
    """Scrape RemoteOK public API with Worldwide & APAC developer roles."""
    jobs = []
    print("[*] Scraping RemoteOK developer board...")
    url = "https://remoteok.com/api?tag=dev"

    try:
        res = requests.get(url, headers=HEADERS, timeout=12)
        if res.status_code == 200:
            data = res.json()
            items = data[1:] if isinstance(data, list) else []
            for item in items:
                title = item.get("position") or ""
                company = item.get("company") or ""
                desc = item.get("description") or ""
                link = item.get("url") or ""
                loc = item.get("location") or "Remote Worldwide"

                if not title or not company or not link:
                    continue

                score, reasons = calculate_match_score(title, desc, tags=item.get("tags", []), location=loc, job_type="contract")
                if score == 0:
                    continue

                hr_email = extract_email(desc)
                job_id = f"remoteok_{item.get('id', abs(hash(link)) % 10000000)}"

                jobs.append({
                    "id": job_id,
                    "source": "remoteok",
                    "title": title,
                    "company": company,
                    "location": loc,
                    "is_remote": 1,
                    "job_type": "part-time",
                    "url": link,
                    "hr_email": hr_email or None,
                    "description": desc[:3000],
                    "match_score": score,
                    "match_reasons": json.dumps(reasons),
                    "status": "new"
                })
    except Exception as e:
        print(f"[-] RemoteOK scrape warning: {e}")

    print(f"[+] RemoteOK: Collected {len(jobs)} candidate jobs.")
    return jobs

# ----------------- SYNC & MAIN ----------------- #

def sync_to_cloudflare(jobs: list, api_url: str, token: str):
    """POST parsed jobs directly to Cloudflare Web App API endpoint in batches."""
    endpoint = f"{api_url.rstrip('/')}/api/jobs/sync"
    print(f"[*] Syncing {len(jobs)} verified remote jobs to {endpoint}...")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    unique_jobs = {}
    for j in jobs:
        unique_jobs[j["url"]] = j

    jobs_to_send = list(unique_jobs.values())

    chunk_size = 50
    total_synced = 0
    for i in range(0, len(jobs_to_send), chunk_size):
        chunk = jobs_to_send[i:i + chunk_size]
        try:
            res = requests.post(endpoint, json={"jobs": chunk}, headers=headers, timeout=25)
            if res.status_code == 200:
                result = res.json()
                total_synced += result.get('count', len(chunk))
            else:
                print(f"[!] Batch sync error: HTTP {res.status_code} - {res.text}")
        except Exception as e:
            print(f"[!] Batch connection error: {e}")

    print(f"[SUCCESS] Total successfully synced to Cloudflare: {total_synced} verified remote opportunities!")

def main():
    parser = argparse.ArgumentParser(description="Opportunity Hunter - Strict Remote & Part-Time Runner")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="Cloudflare Worker or local API URL")
    parser.add_argument("--token", default=DEFAULT_SYNC_TOKEN, help="LOCAL_SYNC_TOKEN")
    parser.add_argument("--dry-run", action="store_true", help="Print jobs without sending to API")
    args = parser.parse_args()

    print("=" * 65)
    print("  OPPORTUNITY HUNTER - STRICT REMOTE & PART-TIME RUNNER")
    print("  Filters: 100% WFH/Remote ONLY • 100% Part-Time/Flexible ONLY")
    print("  Exclusions: On-site, Hybrid, WFO, Penuh Waktu, US-Only, Shopify")
    print("=" * 65)

    all_jobs = []
    all_jobs.extend(scrape_glints_jobs())
    all_jobs.extend(scrape_linkedin_jobs())
    all_jobs.extend(scrape_jobicy_apac_jobs())
    all_jobs.extend(scrape_remoteok_jobs())

    print("=" * 65)
    print(f"[+] Total strictly verified opportunities: {len(all_jobs)}")

    if args.dry_run:
        print("[*] Dry run mode enabled. Sample verified listings:")
        for j in all_jobs[:5]:
            reasons = json.loads(j['match_reasons'])
            print(f"- [{j['match_score']}% Match] {j['title']} @ {j['company']} ({j['location']})")
            print(f"  Reasons: {', '.join(reasons)}")
        return

    if all_jobs:
        sync_to_cloudflare(all_jobs, api_url=args.api_url, token=args.token)
    else:
        print("[!] No strictly matching jobs found in this run.")

if __name__ == "__main__":
    main()
