import React, { useState } from 'react';
import { 
  ExternalLink, 
  Mail, 
  Send, 
  Check, 
  EyeOff, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Clock, 
  Sparkles, 
  DollarSign, 
  AlertCircle 
} from 'lucide-react';
import { Job } from '../../types';

interface JobCardProps {
  job: Job;
  onDraftEmail: (job: Job) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onDraftEmail,
  onUpdateStatus
}) => {
  const [expanded, setExpanded] = useState(false);

  // Parse tags
  let tagsList: string[] = [];
  if (job.tags) {
    try {
      tagsList = typeof job.tags === 'string' ? JSON.parse(job.tags) : job.tags;
    } catch {
      tagsList = job.tags.split(',').map(t => t.trim());
    }
  }

  // Parse match reasons
  let reasonsList: string[] = [];
  if (job.match_reasons) {
    try {
      reasonsList = JSON.parse(job.match_reasons);
    } catch {
      reasonsList = [job.match_reasons];
    }
  }

  // Score styling
  const score = job.match_score || 0;
  let scoreBadgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
  if (score >= 80) {
    scoreBadgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  } else if (score >= 65) {
    scoreBadgeColor = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  } else if (score >= 50) {
    scoreBadgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  }

  return (
    <div className={`bg-slate-900/60 border rounded-xl p-4 sm:p-5 transition-all duration-200 hover:border-slate-700 shadow-sm ${
      job.status === 'sent' 
        ? 'border-indigo-900/40 bg-indigo-950/10' 
        : job.status === 'ignored'
        ? 'border-slate-800/60 opacity-60'
        : 'border-slate-800'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        
        {/* Left Column: Job & Company Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1.5">
            <span className="text-xs font-semibold text-slate-300">
              {job.company}
            </span>
            <span className="text-slate-600">•</span>
            {/* Source Pill */}
            <span className={`text-[11px] px-2 py-0.5 rounded-md font-mono font-medium border ${
              job.source === 'glints'
                ? 'bg-red-500/15 text-red-400 border-red-500/30'
                : job.source === 'linkedin'
                ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                : job.source === 'jobicy_apac'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {job.source}
            </span>
            
            {/* Remote Pill */}
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {job.location || 'Remote'}
            </span>

            {/* APAC Timezone Friendly Pill */}
            {(job.location?.toLowerCase().includes('indonesia') || 
              job.location?.toLowerCase().includes('apac') || 
              job.location?.toLowerCase().includes('singapore') ||
              job.match_reasons?.includes('APAC') || 
              job.source === 'glints' || 
              job.source === 'jobicy_apac') && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                🌏 GMT+7 / APAC
              </span>
            )}

            {/* Part Time Pill */}
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {job.job_type || 'Part-Time'}
            </span>

            {/* Status Pill */}
            {job.status === 'sent' && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" />
                Contacted
              </span>
            )}
          </div>

          <h2 className="text-base sm:text-lg font-bold text-white hover:text-blue-400 transition-colors">
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {job.title}
            </a>
          </h2>

          {/* Salary if available */}
          {job.salary && (
            <p className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{job.salary}</span>
            </p>
          )}

          {/* Match Reasons Badges */}
          {reasonsList.length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5 mt-2.5">
              {reasonsList.map((reason, idx) => (
                <span
                  key={idx}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60"
                >
                  {reason}
                </span>
              ))}
            </div>
          )}

          {/* HR Contact Display */}
          <div className="mt-3 flex items-center gap-2">
            {job.hr_email ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                <Mail className="w-3.5 h-3.5" />
                <span className="font-mono">{job.hr_email}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/50 border border-slate-700/50 px-2 py-0.5 rounded-md">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500/80" />
                <span>No direct HR email in post (apply via job link or add email in pitch)</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Match Score & Action Buttons */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
          
          {/* Match Score Badge */}
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border font-bold text-xs ${scoreBadgeColor}`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>{score}% Match</span>
          </div>

          {/* Action: Draft & Send Pitch */}
          <button
            onClick={() => onDraftEmail(job)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Pitch Email</span>
          </button>

          {/* Secondary Actions */}
          <div className="flex items-center gap-1.5">
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Open Original Job Link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {job.status !== 'ignored' ? (
              <button
                onClick={() => onUpdateStatus(job.id, 'ignored')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
                title="Ignore this job"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => onUpdateStatus(job.id, 'new')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-blue-400 border border-slate-700 transition-colors"
                title="Restore to active"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}

            {job.status !== 'sent' && (
              <button
                onClick={() => onUpdateStatus(job.id, 'sent')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 border border-slate-700 transition-colors"
                title="Mark as already contacted manually"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Description Accordion Toggle */}
      {job.description && (
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span>{expanded ? 'Hide description' : 'Show description'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {expanded && (
            <div 
              className="mt-3 text-xs text-slate-300 leading-relaxed max-h-96 overflow-y-auto bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/80 prose prose-invert prose-xs max-w-none"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          )}
        </div>
      )}

    </div>
  );
};
