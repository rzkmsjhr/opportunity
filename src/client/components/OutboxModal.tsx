import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { EmailRecord } from '../../types';
import { fetchEmails } from '../api';

interface OutboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OutboxModal: React.FC<OutboxModalProps> = ({ isOpen, onClose }) => {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      load();
    }
  }, [isOpen]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEmails();
      setEmails(data.emails);
    } catch (err: any) {
      setError('Failed to load email log: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Outbox & Sent Outreach</h3>
              <p className="text-xs text-slate-400">History of dispatched applications & status</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3 text-xs">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex justify-center items-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : emails.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Send className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No emails sent yet. Select an opportunity to send your first pitch!</p>
            </div>
          ) : (
            emails.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      {item.recipient_name || 'Hiring Team'}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="font-mono text-slate-400">{item.recipient_email}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.sent_at || item.created_at}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase flex items-center gap-1 ${
                        item.status === 'sent'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : item.status === 'failed'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {item.status === 'sent' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      <span>{item.status}</span>
                    </span>
                  </div>
                </div>

                <p className="font-medium text-slate-300">{item.subject}</p>

                {item.error_message && (
                  <p className="text-red-400 text-[11px] bg-red-500/10 p-2 rounded border border-red-500/20">
                    Error: {item.error_message}
                  </p>
                )}

                <details className="text-[11px] text-slate-400 pt-1">
                  <summary className="cursor-pointer text-blue-400 hover:underline">
                    View pitch content
                  </summary>
                  <pre className="mt-2 p-3 bg-slate-900 rounded border border-slate-800 whitespace-pre-wrap font-sans text-slate-300">
                    {item.body_text}
                  </pre>
                </details>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
