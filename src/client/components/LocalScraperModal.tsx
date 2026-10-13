import React, { useState } from 'react';
import { X, Laptop, Copy, Check, Terminal, ExternalLink, ShieldCheck } from 'lucide-react';

interface LocalScraperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocalScraperModal: React.FC<LocalScraperModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  const command = `python local_scraper/scraper.py --token opp-hunter-secret-token`;

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Local Laptop Companion Scraper</h3>
              <p className="text-xs text-slate-400">Run heavy & anti-bot scrapers on your laptop and sync to Cloudflare</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          
          <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 leading-relaxed">
            <p className="font-semibold text-blue-200 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Why run locally from your laptop?</span>
            </p>
            Cloudflare Workers free tier runs 24/7 in the cloud for standard APIs (RemoteOK, Remotive, Jobicy, WWR). 
            However, heavy sites like <strong>LinkedIn, Indeed, and Google Search</strong> aggressively block datacenter IP addresses. 
            Running the companion Python script on your laptop uses your local residential IP to bypass these blocks and automatically pushes fresh jobs to this web app via the secure sync API.
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-200">Step 1: Install Python Dependencies</h4>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-slate-300 flex items-center justify-between">
              <code>pip install -r local_scraper/requirements.txt</code>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-200">Step 2: Run the Companion Scraper</h4>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-slate-300 flex items-center justify-between">
              <code>{command}</code>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors ml-2"
                title="Copy Command"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              The script will query remote part-time developer positions, extract HR contacts, match against your tech competencies (Laravel, React, Node), and push them straight into your Cloudflare D1 database.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-200">Step 3: Optional LinkedIn Session Cookies</h4>
            <p className="text-slate-400 leading-relaxed">
              To deep-search inside LinkedIn, you can pass your `li_at` cookie in `local_scraper/config.json`. The scraper will emulate your browser session safely.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};
