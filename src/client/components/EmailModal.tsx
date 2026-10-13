import React, { useState, useEffect } from 'react';
import { X, Send, Copy, Check, Mail, AlertTriangle, Sparkles } from 'lucide-react';
import { Job } from '../../types';
import { draftEmail, sendOutreachEmail } from '../api';

interface EmailModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSentSuccess: () => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  job,
  isOpen,
  onClose,
  onSentSuccess
}) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (job && isOpen) {
      loadDraft(job.id);
    } else {
      setError(null);
      setSuccessMsg(null);
    }
  }, [job, isOpen]);

  const loadDraft = async (jobId: string) => {
    setLoading(true);
    setError(null);
    try {
      const draft = await draftEmail(jobId);
      setRecipientEmail(draft.recipientEmail || '');
      setRecipientName(draft.recipientName || (job?.company || ''));
      setSubject(draft.subject || '');
      setBodyText(draft.bodyText || '');
    } catch (err: any) {
      setError('Failed to generate draft: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!recipientEmail) {
      setError('Please provide a recipient email address');
      return;
    }

    setSending(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await sendOutreachEmail({
        jobId: job?.id,
        recipientEmail,
        recipientName,
        subject,
        bodyText
      });

      setSuccessMsg('Email dispatched successfully!');
      setTimeout(() => {
        onSentSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to send email. Check your Resend API Key in Settings.');
    } finally {
      setSending(false);
    }
  };

  const handleCopy = () => {
    const fullText = `To: ${recipientEmail}\nSubject: ${subject}\n\n${bodyText}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cold Outreach Pitch</h3>
              <p className="text-xs text-slate-400">Targeting {job.company} • {job.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Sparkles className="w-6 h-6 animate-spin text-blue-500" />
              <p>Tailoring cold pitch to job requirements...</p>
            </div>
          ) : (
            <>
              {/* Recipient HR Email */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Recipient HR Email:
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="e.g. jobs@company.com or hr@company.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
                />
                {!recipientEmail && (
                  <p className="text-[11px] text-amber-400/90 mt-1">
                    Tip: Enter the company's hiring or careers email to send directly, or use Copy to send from your own Gmail.
                  </p>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Subject Line:
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500 text-xs font-medium"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center justify-between">
                  <span>Pitch Body:</span>
                  <span className="text-[11px] text-slate-500 font-normal">Personalized with your portfolio & part-time terms</span>
                </label>
                <textarea
                  rows={14}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 font-sans text-xs leading-relaxed"
                />
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Pitch!' : 'Copy to Clipboard'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || loading || !recipientEmail}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all"
            >
              <Send className={`w-3.5 h-3.5 ${sending ? 'animate-spin' : ''}`} />
              <span>{sending ? 'Sending...' : 'Send Email via Resend'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
