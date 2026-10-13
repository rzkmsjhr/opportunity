import React from 'react';
import { Search, Globe, Sparkles } from 'lucide-react';

interface FilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  minScore: number;
  onMinScoreChange: (val: number) => void;
  region: string;
  onRegionChange: (val: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  minScore,
  onMinScoreChange,
  region,
  onRegionChange
}) => {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
      
      {/* Search Input */}
      <div className="relative w-full md:w-72">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search Laravel, React, Glints, title..."
          className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
        
        {/* Region & Timezone Filter */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Region:</span>
          <select
            value={region}
            onChange={(e) => onRegionChange(e.target.value)}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-slate-900">All Regions</option>
            <option value="apac" className="bg-slate-900">🌏 APAC / Indonesia & SEA (GMT+7)</option>
            <option value="worldwide" className="bg-slate-900">🌐 Worldwide Remote</option>
          </select>
        </div>

        {/* Match Score Dropdown */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Match:</span>
          <select
            value={minScore}
            onChange={(e) => onMinScoreChange(Number(e.target.value))}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
          >
            <option value={0} className="bg-slate-900">All Scores</option>
            <option value={50} className="bg-slate-900">&ge; 50% Match</option>
            <option value={70} className="bg-slate-900">&ge; 70% Strong Match</option>
            <option value={85} className="bg-slate-900">&ge; 85% Perfect Match</option>
          </select>
        </div>

        {/* Status Tab Pills */}
        <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-lg text-xs">
          {[
            { id: '', label: 'All' },
            { id: 'new', label: 'Uncontacted' },
            { id: 'sent', label: 'Sent' },
            { id: 'ignored', label: 'Ignored' },
          ].map((tab) => {
            const isActive = status === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onStatusChange(tab.id)}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
