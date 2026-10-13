import React from 'react';
import { Briefcase, Target, Send, Clock } from 'lucide-react';

interface StatsBarProps {
  totalJobs: number;
  highMatchJobs: number;
  sentEmails: number;
  pendingReview: number;
  partTimeCount: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  totalJobs,
  highMatchJobs,
  sentEmails,
  pendingReview,
  partTimeCount
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      
      {/* Total Scraped */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-medium text-slate-400">Total Scraped</p>
          <p className="text-2xl font-bold text-white mt-1">{totalJobs}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{partTimeCount} flagged part-time</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <Briefcase className="w-5 h-5" />
        </div>
      </div>

      {/* High Competency Match */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-medium text-emerald-400">Top Matches (&ge;70%)</p>
          <p className="text-2xl font-bold text-emerald-300 mt-1">{highMatchJobs}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Strict Part-Time + Tech</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Target className="w-5 h-5" />
        </div>
      </div>

      {/* Pending Outreach */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-medium text-amber-400">Ready to Reach</p>
          <p className="text-2xl font-bold text-amber-300 mt-1">{pendingReview}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Unsent opportunities</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      {/* Sent Applications */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-medium text-indigo-400">Emails Sent</p>
          <p className="text-2xl font-bold text-indigo-300 mt-1">{sentEmails}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Dispatched to HR</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Send className="w-5 h-5" />
        </div>
      </div>

    </div>
  );
};
