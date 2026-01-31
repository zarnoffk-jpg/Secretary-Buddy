import React from 'react';
import { AppSettings } from '../types';
import { Shield, Lock, Users, AlertTriangle, EyeOff, Trash2 } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  updateSettings: (newSettings: AppSettings) => void;
  onFactoryReset: () => void;
}

const Toggle = ({ 
  label, 
  description, 
  enabled, 
  onChange, 
  icon: Icon,
  disabled = false 
}: { 
  label: string; 
  description: string; 
  enabled: boolean; 
  onChange: (val: boolean) => void; 
  icon: any;
  disabled?: boolean;
}) => (
  <div className={`p-6 bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm flex items-start gap-4 transition-all ${disabled ? 'opacity-50 grayscale' : 'hover:shadow-apple-card'}`}>
    <div className={`p-3 rounded-xl ${enabled ? 'bg-clay text-white shadow-md' : 'bg-taupe text-subtle'}`}>
      <Icon size={24} />
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-lg font-bold text-ink">{label}</h3>
        <button 
          onClick={() => !disabled && onChange(!enabled)}
          disabled={disabled}
          className={`relative w-12 h-7 rounded-full transition-colors duration-300 focus:outline-none ${enabled ? 'bg-clay' : 'bg-sand'}`}
        >
          <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>
      <p className="text-sm text-subtle leading-relaxed">{description}</p>
    </div>
  </div>
);

export const SettingsSection: React.FC<SettingsProps> = ({ settings, updateSettings, onFactoryReset }) => {
  
  const handleToggleEncryption = (val: boolean) => {
    updateSettings({ ...settings, enableEncryption: val });
  };

  const handleTogglePII = (val: boolean) => {
    updateSettings({ ...settings, enablePIIScrub: val });
  };

  const handleResetClick = () => {
    if (window.confirm("WARNING: This will permanently delete ALL data, settings, and accounts from this device. This cannot be undone. Are you sure?")) {
        onFactoryReset();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      <div className="pb-6 border-b border-sand">
        <h2 className="text-4xl font-serif font-bold text-ink">Settings</h2>
        <p className="text-subtle mt-2 font-serif italic">Security preferences and access control</p>
      </div>

      <div className="max-w-3xl space-y-6">
        
        {/* Security Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-subtle uppercase tracking-wider pl-1">Data Protection</h3>
          
          <Toggle
            label="Encrypt Data & Require Vault"
            description="When enabled, your data is encrypted with AES-GCM in local storage. You will need to enter a vault password every time you open the app or reload the page. Disabling this saves data as plain text."
            enabled={settings.enableEncryption}
            onChange={handleToggleEncryption}
            icon={Lock}
          />

          <Toggle
            label="Scrub Personal Details (AI)"
            description="Automatically remove email addresses and phone numbers from text before sending it to the AI assistant for processing. This protects contact privacy."
            enabled={settings.enablePIIScrub}
            onChange={handleTogglePII}
            icon={EyeOff}
          />
        </div>

        {/* Access Section */}
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-bold text-subtle uppercase tracking-wider pl-1">Access Control</h3>
          
          <Toggle
            label="Allow Committee Logins"
            description="Enable multi-user support for other committee members to access shared rosters. (Feature currently in development)"
            enabled={settings.enableCommitteeLogin}
            onChange={() => {}}
            icon={Users}
            disabled={true}
          />
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-amber-50/50 rounded-2xl border border-amber-100/50 flex gap-4">
           <AlertTriangle className="text-amber-500 shrink-0" />
           <div className="text-sm text-amber-900/70">
              <strong className="block mb-1 text-amber-900">Security Note</strong>
              Changes to encryption settings will take effect immediately. If you enable encryption, ensure you remember your vault password, or your data will be unrecoverable.
           </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-12 pt-8 border-t border-red-100">
             <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider pl-1 mb-4">Danger Zone</h3>
             <div className="p-6 bg-red-50/50 rounded-2xl border border-red-100 flex items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-red-900">Factory Reset Device</h3>
                    <p className="text-sm text-red-800/70 mt-1">Permanently delete all accounts, keys, and data from this browser.</p>
                </div>
                <button 
                    onClick={handleResetClick}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                    <Trash2 size={16} /> Reset
                </button>
             </div>
        </div>

      </div>
    </div>
  );
};