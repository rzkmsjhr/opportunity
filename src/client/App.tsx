import React, { useState, useEffect, useCallback } from 'react';
import { 
  Header 
} from './components/Header';
import { StatsBar } from './components/StatsBar';
import { FilterBar } from './components/FilterBar';
import { JobCard } from './components/JobCard';
import { EmailModal } from './components/EmailModal';
import { SettingsModal } from './components/SettingsModal';
import { LocalScraperModal } from './components/LocalScraperModal';
import { OutboxModal } from './components/OutboxModal';
import { 
  fetchJobs, 
  fetchStats, 
  triggerScraper, 
  updateJobStatus, 
  fetchSettings 
} from './api';
import { Job, AppSettings } from '../types';
import { RefreshCw, Briefcase, ChevronLeft, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  // State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [region, setRegion] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalJobs: 0,
    highMatchJobs: 0,
    sentEmails: 0,
    pendingReview: 0,
    partTimeCount: 0
  });

  // Settings
  const [settings, setSettings] = useState<Partial<AppSettings>>({});

  // Modals
  const [selectedJobForEmail, setSelectedJobForEmail] = useState<Job | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLocalScraperOpen, setIsLocalScraperOpen] = useState(false);
  const [isOutboxOpen, setIsOutboxOpen] = useState(false);

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load stats & settings
  const loadStatsAndSettings = useCallback(async () => {
    try {
      const [statsData, settingsData] = await Promise.all([
        fetchStats(),
        fetchSettings()
      ]);
      setStats(statsData);
      setSettings(settingsData);
    } catch (err: any) {
      console.error('Error fetching initial data:', err);
    }
  }, []);

  // Load jobs
  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJobs({
        page,
        limit,
        search,
        status,
        minScore,
        region
      });
      setJobs(data.jobs);
      setTotalJobs(data.total);
    } catch (err: any) {
      showToast('Error loading jobs: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, minScore, region]);

  useEffect(() => {
    loadStatsAndSettings();
  }, [loadStatsAndSettings]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Handle Cloud Scraper run
  const handleRunScraper = async () => {
    setIsScraping(true);
    showToast('Starting cloud scrapers across RemoteOK, Remotive, Jobicy, WWR, Arbeitnow...', 'info');
    try {
      const result = await triggerScraper();
      showToast(
        `Scraping finished: Checked ${result.totalScraped} listings, added ${result.newSaved} new matching jobs!`,
        'success'
      );
      loadJobs();
      loadStatsAndSettings();
    } catch (err: any) {
      showToast('Scraping error: ' + err.message, 'error');
    } finally {
      setIsScraping(false);
    }
  };

  // Handle status update
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateJobStatus(id, newStatus);
      setJobs(jobs.map(j => j.id === id ? { ...j, status: newStatus as any } : j));
      loadStatsAndSettings();
      showToast(`Updated status to ${newStatus}`, 'success');
    } catch (err: any) {
      showToast('Failed to update status: ' + err.message, 'error');
    }
  };

  // Handle open email modal
  const handleOpenEmailModal = (job: Job) => {
    setSelectedJobForEmail(job);
    setIsEmailModalOpen(true);
  };

  const totalPages = Math.ceil(totalJobs / limit);

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-16 right-6 z-50 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold border flex items-center gap-2 animate-in slide-in-from-top-4 duration-200 ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' 
            : toast.type === 'error'
            ? 'bg-red-950/90 text-red-300 border-red-500/40'
            : 'bg-blue-950/90 text-blue-300 border-blue-500/40'
        }`}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Header
        isScraping={isScraping}
        onRunScraper={handleRunScraper}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenOutbox={() => setIsOutboxOpen(true)}
        onOpenLocalScraper={() => setIsLocalScraperOpen(true)}
        autoSendEnabled={settings.auto_send_enabled === 'true'}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Profile Intro Banner */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-slate-900/40 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Automated Outreach Assistant</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                Active Match Engine
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Filtering <strong>Remote / WFH</strong> and <strong>Part-Time</strong> IT positions tailored to Rizki's primary stack: 
              <span className="text-blue-300"> PHP (Laravel, Symfony)</span>, 
              <span className="text-indigo-300"> React/Next.js/Remix</span>, 
              <span className="text-purple-300"> Vue/Nuxt, Node.js</span>, and 
              <span className="text-cyan-300"> Fullstack leadership</span>.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setMinScore(70);
                setStatus('new');
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 transition-colors"
            >
              Filter Top Matches (&ge;70%)
            </button>
          </div>
        </div>

        {/* Stats KPI Bar */}
        <StatsBar
          totalJobs={stats.totalJobs}
          highMatchJobs={stats.highMatchJobs}
          sentEmails={stats.sentEmails}
          pendingReview={stats.pendingReview}
          partTimeCount={stats.partTimeCount}
        />

        {/* Search & Filter Toolbar */}
        <FilterBar
          search={search}
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          status={status}
          onStatusChange={(val) => { setStatus(val); setPage(1); }}
          minScore={minScore}
          onMinScoreChange={(val) => { setMinScore(val); setPage(1); }}
          region={region}
          onRegionChange={(val) => { setRegion(val); setPage(1); }}
        />

        {/* Jobs List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-xs">Fetching opportunities matching your profile...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl py-16 px-4 text-center">
            <Briefcase className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-white">No opportunities found for this filter</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-5">
              Click "Scrape Now" to fetch live opportunities from cloud remote boards, or lower the match score threshold.
            </p>
            <button
              onClick={handleRunScraper}
              disabled={isScraping}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 inline-flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
              <span>Scrape Live Remote Boards</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onDraftEmail={handleOpenEmailModal}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {totalJobs > limit && (
          <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-400">
            <p>
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalJobs)} of {totalJobs} jobs
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium text-white px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500">
        <p>Opportunity Hunter & Automation • Built for M Rizki Masjahri Putra • Cloudflare D1 + Workers & Edge</p>
      </footer>

      {/* Modals */}
      <EmailModal
        job={selectedJobForEmail}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onSentSuccess={() => {
          showToast('Email sent and status updated to Contacted!', 'success');
          loadJobs();
          loadStatsAndSettings();
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={() => {
          showToast('Settings saved successfully!', 'success');
          loadStatsAndSettings();
        }}
      />

      <LocalScraperModal
        isOpen={isLocalScraperOpen}
        onClose={() => setIsLocalScraperOpen(false)}
      />

      <OutboxModal
        isOpen={isOutboxOpen}
        onClose={() => setIsOutboxOpen(false)}
      />

    </div>
  );
};
