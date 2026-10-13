# Local Laptop Companion Scraper

This Python script is designed to run locally on your laptop to scrape job platforms that block datacenter/Cloudflare IP addresses (like LinkedIn, Indeed, Google, Lever, Greenhouse). It automatically parses HR contact emails, calculates competency match scores against your profile, and syncs the jobs directly to your Cloudflare Web App & D1 Database.

---

## 🚀 Quick Start

### 1. Install Requirements
Make sure you have Python 3.9+ installed, then run:
```bash
pip install -r local_scraper/requirements.txt
```

### 2. Run Companion Scraper (Local Dev)
If testing with your local development server (`http://localhost:8787`):
```bash
python local_scraper/scraper.py --api-url http://localhost:8787 --token opp-hunter-secret-token
```

### 3. Run Companion Scraper (Production Cloudflare Deployment)
Once your app is deployed to Cloudflare:
```bash
python local_scraper/scraper.py --api-url https://opportunity-hunter.<your-account>.workers.dev --token opp-hunter-secret-token
```

---

## ⚙️ Options & Arguments

| Flag | Default | Description |
|------|---------|-------------|
| `--api-url` | `http://localhost:8787` | Target web app URL |
| `--token` | `opp-hunter-secret-token` | Secret sync token (matches `LOCAL_SYNC_TOKEN` in `wrangler.toml`) |
| `--query` | `remote part-time fullstack` | Search keywords |
| `--dry-run` | `false` | Preview scraped opportunities in console without uploading |

---

## 🔒 Security
The endpoint `/api/jobs/sync` is strictly protected by Bearer Token authentication. Only requests with the valid `LOCAL_SYNC_TOKEN` are accepted.
