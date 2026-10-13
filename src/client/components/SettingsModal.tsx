import React, { useState, useEffect } from 'react';
import { X, Save, Key, User, Zap, Mail, Check, AlertCircle } from 'lucide-react';
import { AppSettings } from '../../types';
import { fetchSettings, saveSettings } from '../api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved
}) => {
  const [formData, setFormData] = useState<Partial<AppSettings>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
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
      const data = await fetchSettings();
      setFormData(data);
    } catch (err: any) {
      setError('Failed to load settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveSettings(formData);
      setSavedSuccess(true);
      onSettingsSaved();
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">System Settings & Profile</h3>
              <p className="text-xs text-slate-400">Configure profile pitch, email credentials, and auto-pilot</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Settings successfully updated!</span>
            </div>
          )}

          {/* Section 1: Applicant Profile */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Applicant Profile (M Rizki Masjahri Putra)</span>
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.applicant_name || ''}
                  onChange={(e) => setFormData({ ...formData, applicant_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.applicant_email || ''}
                  onChange={(e) => setFormData({ ...formData, applicant_email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">WhatsApp / Phone</label>
                <input
                  type="text"
                  value={formData.applicant_phone || ''}
                  onChange={(e) => setFormData({ ...formData, applicant_phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">GitHub URL</label>
                <input
                  type="text"
                  value={formData.applicant_github || ''}
                  onChange={(e) => setFormData({ ...formData, applicant_github: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">LinkedIn Profile</label>
              <input
                type="text"
                value={formData.applicant_linkedin || ''}
                onChange={(e) => setFormData({ ...formData, applicant_linkedin: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>Email Delivery Credentials (Resend)</span>
            </h4>

            <div>
              <label className="block text-slate-400 font-medium mb-1 flex items-center justify-between">
                <span>Resend API Key</span>
                <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  Get Free Key (resend.com) &rarr;
                </a>
              </label>
              <input
                type="password"
                placeholder="re_123456789..."
                value={formData.resend_api_key || ''}
                onChange={(e) => setFormData({ ...formData, resend_api_key: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Sender Email</label>
                <input
                  type="text"
                  placeholder="onboarding@resend.dev or you@yourdomain.com"
                  value={formData.sender_email || ''}
                  onChange={(e) => setFormData({ ...formData, sender_email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Sender Display Name</label>
                <input
                  type="text"
                  value={formData.sender_name || ''}
                  onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Autonomous Outreach (Auto-Pilot)</span>
            </h4>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <p className="font-semibold text-white">Enable Auto-Pilot Outreach</p>
                <p className="text-slate-400 text-[11px]">
                  Automatically drafts and dispatches cold email when a high-match job with HR email is found.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  auto_send_enabled: formData.auto_send_enabled === 'true' ? 'false' : 'true'
                })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.auto_send_enabled === 'true' ? 'bg-blue-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.auto_send_enabled === 'true' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Min Match Score to Auto-Send (%)</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={formData.auto_send_threshold || '85'}
                  onChange={(e) => setFormData({ ...formData, auto_send_threshold: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Max Emails per Day (Safety Limit)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.daily_send_limit || '15'}
                  onChange={(e) => setFormData({ ...formData, daily_send_limit: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
