import React from 'react';
import { 
  Briefcase, 
  RefreshCw, 
  Settings, 
  Send, 
  Laptop, 
  ShieldCheck, 
  Zap, 
  FileText 
} from 'lucide-react';

interface HeaderProps {
  isScraping: boolean;
  onRunScraper: () => void;
  onOpenSettings: () => void;
  onOpenOutbox: () => void;
  onOpenLocalScraper: () => void;
  autoSendEnabled: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isScraping,
  onRunScraper,
  onOpenSettings,
  onOpenOutbox,
  onOpenLocalScraper,
  autoSendEnabled
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Logo & Profile Tag */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-lg">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Opportunity Hunter
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium border border-blue-500/30">
                Cloudflare D1 + Edge
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>Target: <strong className="text-slate-300">Remote • Part-Time IT</strong></span>
              <span>•</span>
              <span className="text-indigo-400 font-medium">M Rizki Masjahri Putra</span>
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
          
          {/* Auto-Pilot Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            autoSendEnabled 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <Zap className={`w-3.5 h-3.5 ${autoSendEnabled ? 'text-emerald-400 fill-emerald-400' : 'text-slate-500'}`} />
            <span>Auto-Pilot: {autoSendEnabled ? 'Active' : 'Off'}</span>
          </div>

          {/* Run Cloud Scraper */}
          <button
            onClick={onRunScraper}
            disabled={isScraping}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
            title="Fetch latest remote part-time jobs from RemoteOK, Remotive, Jobicy, WWR, Arbeitnow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
            <span>{isScraping ? 'Scraping Cloud...' : 'Scrape Now'}</span>
          </button>

          {/* Local Laptop Runner */}
          <button
            onClick={onOpenLocalScraper}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 transition-colors"
            title="Instructions & script to run heavy scrapers (LinkedIn, etc.) on your laptop"
          >
            <Laptop className="w-3.5 h-3.5 text-blue-400" />
            <span>Laptop Runner</span>
          </button>

          {/* Sent Applications Outbox */}
          <button
            onClick={onOpenOutbox}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>Outbox</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 transition-colors"
            title="Settings & Credentials"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Settings</span>
          </button>
        </div>

      </div>
    </header>
  );
};
