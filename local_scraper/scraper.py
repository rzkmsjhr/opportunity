"""
Opportunity Hunter - Local Laptop Companion Scraper
Designed for M Rizki Masjahri Putra to scrape remote, part-time IT jobs
from residential IP and push directly to Cloudflare Web App & D1 Database.
"""

import sys
import re
import json
import time
import argparse
from urllib.parse import urlparse, quote_plus
import requests
from bs4 import BeautifulSoup

DEFAULT_API_URL = "http://localhost:8787"
DEFAULT_SYNC_TOKEN = "opp-hunter-secret-token"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.google.com/"
}

# Tech competencies from Rizki's CV
CORE_KEYWORDS = [
    "php", "laravel", "symfony", "codeigniter",
    "react", "next.js", "remix", "vue", "nuxt", "angular",
    "node.js", "typescript", "javascript", "fastapi", "python",
    "fullstack", "frontend", "backend", "wordpress"
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
        
    if domain and '.' in domain and not any(ign in domain for ign in ['github.com', 'google.com']):
        return f"careers@{domain}"
        
    return ""

def calculate_match_score(title: str, description: str, tags: list = None) -> tuple:
    """Calculate match score based on Part-Time + Remote + Tech Stack."""
    text = f"{title} {description} {' '.join(tags or [])}".lower()
    score = 0
    reasons = []
    
    # 1. Part-time check
    is_part_time = any(kw in text for kw in [
        'part-time', 'part time', 'hourly', 'contract', 'freelance', 'flexible hours', 'side gig'
    ])
    if is_part_time:
        score += 35
        reasons.append("Part-time / Flexible Contract verified")
    else:
        score = max(0, score - 15)
        
    # 2. Remote check
    is_remote = any(kw in text for kw in [
        'remote', 'wfh', 'work from home', 'anywhere', 'worldwide'
    ])
    if is_remote:
        score += 30
        reasons.append("Remote / WFH verified")
        
    # 3. Tech stack check
    matched_tech = []
    for kw in CORE_KEYWORDS:
        if re.search(r'\b' + re.escape(kw) + r'\b', text):
            matched_tech.append(kw.capitalize())
            
    if matched_tech:
        tech_score = min(35, len(matched_tech) * 7)
        score += tech_score
        reasons.append(f"Matched skills: {', '.join(matched_tech[:5])}")
        
    final_score = min(100, max(0, score))
    return final_score, reasons

def scrape_lever_jobs(query: str = "remote part-time developer") -> list:
    """Search public job aggregators and developer boards for remote part-time roles."""
    jobs = []
    print(f"[*] Querying developer boards for: '{query}'...")
    
    search_urls = [
        f"https://remoteok.com/api?tag=dev",
        f"https://jobicy.com/api/v2/remote-jobs?count=20&industry=tech"
    ]
    
    for url in search_urls:
        try:
            res = requests.get(url, headers=HEADERS, timeout=12)
            if res.status_code != 200:
                continue
            
            data = res.json()
            items = []
            if isinstance(data, list):
                items = data[1:] # skip disclaimer
            elif isinstance(data, dict) and "jobs" in data:
                items = data["jobs"]
                
            for item in items:
                title = item.get("position") or item.get("jobTitle") or ""
                company = item.get("company") or item.get("companyName") or ""
                desc = item.get("description") or item.get("jobDescription") or ""
                link = item.get("url") or item.get("link") or ""
                
                if not title or not company or not link:
                    continue
                    
                score, reasons = calculate_match_score(title, desc)
                hr_email = extract_email(desc)
                
                job_id = f"laptop_{abs(hash(link)) % 10000000}"
                
                jobs.append({
                    "id": job_id,
                    "source": "laptop_runner",
                    "title": title,
                    "company": company,
                    "location": "Remote",
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
            print(f"[-] Scrape error for {url}: {e}")
            
    print(f"[+] Found {len(jobs)} candidate jobs from runner sources.")
    return jobs

def sync_to_cloudflare(jobs: list, api_url: str, token: str):
    """POST parsed jobs directly to Cloudflare Web App API endpoint."""
    endpoint = f"{api_url.rstrip('/')}/api/jobs/sync"
    print(f"[*] Syncing {len(jobs)} jobs to {endpoint}...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        res = requests.post(endpoint, json={"jobs": jobs}, headers=headers, timeout=20)
        if res.status_code == 200:
            result = res.json()
            print(f"[SUCCESS] Synced {result.get('count', len(jobs))} jobs to your Cloudflare Web App!")
        else:
            print(f"[ERROR] Sync failed: HTTP {res.status_code} - {res.text}")
    except Exception as e:
        print(f"[ERROR] Could not connect to API at {endpoint}: {e}")

def main():
    parser = argparse.ArgumentParser(description="Opportunity Hunter - Local Laptop Companion Scraper")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="Cloudflare Worker or local API URL (e.g. http://localhost:8787 or https://your-worker.workers.dev)")
    parser.add_argument("--token", default=DEFAULT_SYNC_TOKEN, help="LOCAL_SYNC_TOKEN matching your wrangler.toml / worker config")
    parser.add_argument("--query", default="remote part-time fullstack", help="Job search query")
    parser.add_argument("--dry-run", action="store_true", help="Print jobs without sending to API")
    args = parser.parse_args()
    
    print("=" * 60)
    print("  OPPORTUNITY HUNTER - LOCAL RUNNER")
    print(f"  Target: Remote Part-Time IT Roles")
    print(f"  Profile: M Rizki Masjahri Putra (PHP/Laravel + React/Node)")
    print("=" * 60)
    
    jobs = scrape_lever_jobs(query=args.query)
    
    if args.dry_run:
        print("[*] Dry run mode enabled. Printing first 3 jobs:")
        for j in jobs[:3]:
            print(f"- [{j['match_score']}% Match] {j['title']} @ {j['company']} (HR: {j.get('hr_email')})")
        return
        
    if jobs:
        sync_to_cloudflare(jobs, api_url=args.api_url, token=args.token)
    else:
        print("[!] No matching jobs found in this run.")

if __name__ == "__main__":
    main()
