import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { MeetingsSection } from './components/Meetings';
import { CorrespondenceSection } from './components/Correspondence';
import { ActionItemsSection } from './components/ActionItems';
import { CaseLogSection } from './components/CaseLog';
import { RosterSection } from './components/Roster';
import { SettingsSection } from './components/Settings';
import { AppData, TabId, Contact, Meeting, ActionItem, AppSettings } from './types';
import { Feather, Save, Lock, Unlock, ShieldAlert } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { encryptData, decryptData, scrubPII, hashString } from './services/security';

const STORAGE_KEY_LEGACY = 'secretary-buddy-data';
const STORAGE_KEY_ENCRYPTED = 'secretary-buddy-data-encrypted';
const STORAGE_KEY_SETTINGS = 'secretary-buddy-settings';
const STORAGE_KEY_OWNER = 'secretary-buddy-owner'; // New secure storage for owner creds

// Default settings: Secure by default
const defaultSettings: AppSettings = {
  enableEncryption: true,
  enablePIIScrub: true,
  enableCommitteeLogin: false
};

const defaultData: AppData = {
  meetings: [],
  correspondence: [],
  actionItems: [],
  contacts: [],
  caseLog: [],
  committeeRoster: [],
  stickyNote: '',
  lastUpdated: null
};

export default function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasOwnerAccount, setHasOwnerAccount] = useState(false);
  
  // App Data & UI State
  const [data, setData] = useState<AppData>(defaultData);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  // Security / Vault State
  const [isLocked, setIsLocked] = useState(true); // Locked by default if encryption enabled
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [hasEncryptedData, setHasEncryptedData] = useState(false);

  // --------------------------------------------------------------------------
  // INITIAL LOAD EFFECT
  // --------------------------------------------------------------------------
  useEffect(() => {
    // 1. Check if Owner Account Exists
    const ownerData = localStorage.getItem(STORAGE_KEY_OWNER);
    if (ownerData) {
      setHasOwnerAccount(true);
    }

    // 2. Load Settings
    const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    const currentSettings = savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    setSettings(currentSettings);

    // 3. Check Data Encryption Status
    // If encryption is DISABLED in settings, we skip the lock screen entirely
    if (!currentSettings.enableEncryption) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_LEGACY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.stickyNote === 'undefined') parsed.stickyNote = '';
          setData(parsed);
        }
      } catch (error) {
        console.error('Failed to load legacy data', error);
      }
      setIsLocked(false);
    } else {
      // If encryption is ENABLED, check for encrypted blob
      const savedEncrypted = localStorage.getItem(STORAGE_KEY_ENCRYPTED);
      if (savedEncrypted) {
        setHasEncryptedData(true);
        setIsLocked(true); 
      } else {
        setIsLocked(true); 
        setHasEncryptedData(false);
      }
    }
    
    setLoading(false);
  }, []);

  // --------------------------------------------------------------------------
  // SAVE EFFECT (Auto-Save)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (loading) return; // Don't save while loading
    if (!isAuthenticated) return; // Don't save if not logged in

    const performSave = async () => {
      setSaving(true);
      
      // Save Settings
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));

      try {
        if (!settings.enableEncryption) {
          // PATH A: Plain Text Save
          localStorage.setItem(STORAGE_KEY_LEGACY, JSON.stringify({
            ...data,
            lastUpdated: new Date().toISOString()
          }));
          // Clean up encrypted data if we switched to plain text
          localStorage.removeItem(STORAGE_KEY_ENCRYPTED);
        } 
        else if (!isLocked && password) {
          // PATH B: Encrypted Save
          // We only save if we are unlocked AND have the password in memory
          const encrypted = await encryptData({
            ...data,
            lastUpdated: new Date().toISOString()
          }, password);
          localStorage.setItem(STORAGE_KEY_ENCRYPTED, encrypted);
          // Clean up plain data if we switched to encryption
          localStorage.removeItem(STORAGE_KEY_LEGACY);
        }
      } catch (error) {
        console.error('Save failed:', error);
      }
      
      setTimeout(() => setSaving(false), 500);
    };

    const timeout = setTimeout(performSave, 1000);
    return () => clearTimeout(timeout);
  }, [data, settings, isLocked, password, loading, isAuthenticated]);

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------

  const handleAuthenticate = async (email: string, pass: string): Promise<boolean> => {
    const ownerData = localStorage.getItem(STORAGE_KEY_OWNER);
    if (!ownerData) return false;

    const { email: storedEmail, passwordHash } = JSON.parse(ownerData);
    const inputHash = await hashString(pass);

    if (email.toLowerCase() === storedEmail.toLowerCase() && inputHash === passwordHash) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleCreateAccount = async (email: string, pass: string): Promise<void> => {
    const passwordHash = await hashString(pass);
    const ownerObject = {
      email,
      passwordHash,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY_OWNER, JSON.stringify(ownerObject));
    setHasOwnerAccount(true);
    setIsAuthenticated(true);
  };

  const handleRecoverAccount = async (vaultKey: string, newLoginPass: string, newEmail: string): Promise<boolean> => {
    try {
        // 1. Verify the Vault Key by attempting to decrypt the data
        const encrypted = localStorage.getItem(STORAGE_KEY_ENCRYPTED);
        
        // If no encrypted data exists, we can't verify the vault key
        if (!encrypted && settings.enableEncryption) {
            throw new Error("No data found to verify.");
        }
        
        if (encrypted) {
            // This will throw if the key is wrong
            await decryptData(encrypted, vaultKey);
        }

        // 2. Verification Successful - Update Credentials
        const ownerDataStr = localStorage.getItem(STORAGE_KEY_OWNER);
        if (ownerDataStr) {
            const ownerData = JSON.parse(ownerDataStr);
            
            // Update Password Hash
            const newHash = await hashString(newLoginPass);
            ownerData.passwordHash = newHash;
            
            // Update Email
            ownerData.email = newEmail;

            localStorage.setItem(STORAGE_KEY_OWNER, JSON.stringify(ownerData));
            return true;
        }
        return false;
    } catch (e) {
        console.error("Recovery failed:", e);
        return false; 
    }
  };

  const handleLogout = () => {
    // 1. Clear In-Memory Auth State
    setIsAuthenticated(false);
    
    // 2. Lock the Vault Logic (so previous password isn't cached in state)
    setIsLocked(true);
    setPassword('');
    
    // 3. Clear Decrypted Data from Memory (Security Best Practice)
    setData(defaultData);
  };

  const handleResetApp = () => {
    localStorage.removeItem(STORAGE_KEY_OWNER);
    localStorage.removeItem(STORAGE_KEY_ENCRYPTED);
    localStorage.removeItem(STORAGE_KEY_LEGACY);
    localStorage.removeItem(STORAGE_KEY_SETTINGS);

    setIsAuthenticated(false);
    setHasOwnerAccount(false);
    setIsLocked(true);
    setHasEncryptedData(false);
    setPassword('');
    setData(defaultData);
    setSettings(defaultSettings);
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ENCRYPTED);
      if (saved) {
        const decrypted = await decryptData(saved, password);
        if (typeof decrypted.stickyNote === 'undefined') decrypted.stickyNote = '';
        setData(decrypted);
      }
      setIsLocked(false);
    } catch (err) {
      setAuthError('Incorrect vault password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) {
      setAuthError('Password must be at least 4 characters.');
      return;
    }
    const legacy = localStorage.getItem(STORAGE_KEY_LEGACY);
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        setData(parsed);
      } catch(e) {
        setData({...defaultData});
      }
    } else {
      setData({...defaultData});
    }

    setIsLocked(false);
  };

  const updateData = <K extends keyof AppData>(key: K, value: AppData[K]) => {
    setData(prev => ({
      ...prev,
      [key]: value,
      lastUpdated: new Date().toISOString()
    }));
  };

  const handleMagicInput = async (input: string): Promise<string> => {
    if (!process.env.API_KEY) {
      return "Error: API Key is missing.";
    }

    const processedInput = settings.enablePIIScrub ? scrubPII(input) : input;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: processedInput,
        config: {
          systemInstruction: `You are an expert executive secretary. Analyze the user's raw notes and extract structured data to organize their day.
          
          Current Date: ${new Date().toISOString().split('T')[0]}

          Rules:
          1. Extract 'contacts' if new people are mentioned with details.
          2. Extract 'meetings' if a time and event are mentioned.
          3. Extract 'actionItems' for tasks. 
          4. Infer missing details reasonably.
          5. Set priority to 'medium' if unspecified.
          6. Treat [EMAIL_REDACTED] as valid data.
          `,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              contacts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    role: { type: Type.STRING },
                    email: { type: Type.STRING },
                    phone: { type: Type.STRING },
                    address: { type: Type.STRING },
                  }
                }
              },
              meetings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    date: { type: Type.STRING, description: "YYYY-MM-DD" },
                    time: { type: Type.STRING, description: "HH:MM" },
                    location: { type: Type.STRING },
                    notes: { type: Type.STRING },
                  }
                }
              },
              actionItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    dueDate: { type: Type.STRING, description: "YYYY-MM-DD" },
                    priority: { type: Type.STRING, enum: ["low", "medium", "high"] },
                    assignee: { type: Type.STRING },
                  }
                }
              }
            }
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      const today = new Date().toISOString().split('T')[0];
      
      const newContacts: Contact[] = (result.contacts || []).map((c: any) => ({
        ...c,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        role: c.role || '',
        email: c.email || '',
        phone: c.phone || '',
        address: c.address || ''
      }));

      const newMeetings: Meeting[] = (result.meetings || []).map((m: any) => ({
        ...m,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        time: m.time || '',
        location: m.location || '',
        notes: m.notes || ''
      }));

      const newActionItems: ActionItem[] = (result.actionItems || []).map((a: any) => ({
        ...a,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        status: 'pending',
        createdDate: today, // Auto-stamp creation date
        priority: a.priority || 'medium',
        assignee: a.assignee || ''
      }));

      setData(prev => ({
        ...prev,
        contacts: [...prev.contacts, ...newContacts],
        meetings: [...prev.meetings, ...newMeetings],
        actionItems: [...prev.actionItems, ...newActionItems],
        lastUpdated: new Date().toISOString()
      }));

      const summary = [];
      if (newContacts.length) summary.push(`${newContacts.length} contacts`);
      if (newMeetings.length) summary.push(`${newMeetings.length} meetings`);
      if (newActionItems.length) summary.push(`${newActionItems.length} tasks`);

      const statusPrefix = settings.enablePIIScrub 
        ? "Filed successfully (Privacy Shield Active): " 
        : "Filed successfully: ";

      return summary.length > 0 
        ? `${statusPrefix}${summary.join(', ')}.` 
        : "Processed, but no specific items were found.";

    } catch (e) {
      console.error(e);
      return "Failed to process. Please try again.";
    }
  };


  if (!isAuthenticated) {
    return (
      <Login 
        hasAccount={hasOwnerAccount}
        onAuthenticate={handleAuthenticate}
        onCreateAccount={handleCreateAccount}
        onRecoverAccount={handleRecoverAccount}
      />
    );
  }

  if (isLocked && settings.enableEncryption) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl p-10 animate-fade-in-up">
          <div className="w-16 h-16 bg-clay text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow">
            {hasEncryptedData ? <Lock size={32} /> : <ShieldAlert size={32} />}
          </div>
          
          <h1 className="text-3xl font-serif font-bold text-ink mb-2">
            {hasEncryptedData ? 'Secure Vault Locked' : 'Setup Secure Vault'}
          </h1>
          <p className="text-subtle mb-8">
            {hasEncryptedData 
              ? 'Enter your password to decrypt your data.' 
              : 'Create a password to encrypt your local data. Do not lose this password.'}
          </p>

          <form onSubmit={hasEncryptedData ? handleUnlock : handleSetupVault} className="space-y-4">
            <div className="group bg-paper/50 focus-within:bg-white border border-sand/50 focus-within:border-clay/50 focus-within:shadow-sm rounded-2xl overflow-hidden transition-all duration-300 relative">
              <label className="block px-4 pt-4 pb-1 text-[10px] font-bold text-subtle/70 uppercase tracking-[0.15em]">Password</label>
              <input 
                type="password"
                className="w-full bg-transparent border-none px-4 pt-0 pb-4 text-ink font-medium focus:ring-0 text-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            
            {authError && (
              <div className="text-red-500 text-sm font-medium animate-pulse">{authError}</div>
            )}

            <button 
              type="submit" 
              disabled={loading || !password}
              className="w-full py-4 bg-clay text-white font-bold rounded-2xl shadow-lg hover:shadow-clay/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                'Decrypting...' 
              ) : (
                <>{hasEncryptedData ? <Unlock size={18} /> : <Save size={18} />} {hasEncryptedData ? 'Unlock' : 'Create Vault'}</>
              )}
            </button>
            
            <div className="pt-4">
                 <button 
                  type="button" 
                  onClick={handleLogout}
                  className="text-xs text-subtle hover:text-ink underline decoration-dotted"
                 >
                   Return to Sign In
                 </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center text-subtle font-serif italic animate-pulse">
        Preparing workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen text-ink font-sans flex flex-col selection:bg-clay/20">
      <header className="h-20 px-8 sticky top-0 z-50 flex items-center justify-between bg-paper/60 backdrop-blur-xl border-b border-sand/30 transition-all duration-500 ease-in-out [body.has-modal_&]:opacity-0 [body.has-modal_&]:-translate-y-4 [body.has-modal_&]:pointer-events-none">
        <div className="flex items-center gap-4 group cursor-default">
          <div className="w-10 h-10 bg-clay text-white rounded-xl flex items-center justify-center shadow-apple-card transition-all duration-500 ease-spring group-hover:rotate-[15deg] group-hover:scale-110 group-hover:shadow-glow">
            <Feather size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-ink leading-tight tracking-tight">Secretary Buddy</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-subtle font-medium opacity-80 flex items-center gap-1">
              {settings.enableEncryption 
                ? <><Lock size={8} className="text-green-600" /> Encrypted Vault</>
                : <span className="text-orange-400">Standard Mode</span>
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-xs font-medium text-subtle flex items-center gap-2 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white/50">
            {saving ? (
              <>
                <Save size={12} className="animate-spin text-clay" />
                <span className="italic">Saving...</span>
              </>
            ) : data.lastUpdated ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-clay/70"></span>
                Saved {new Date(data.lastUpdated).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}
              </>
            ) : 'Ready'}
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

        <main className="flex-1 p-8 md:p-12 min-w-0 overflow-y-auto overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <Dashboard 
                data={data} 
                setActiveTab={setActiveTab} 
                onMagicInput={handleMagicInput}
              />
            )}
            
            {activeTab === 'settings' && (
              <SettingsSection
                settings={settings}
                updateSettings={setSettings}
                onFactoryReset={handleResetApp}
              />
            )}

            <div className={(activeTab === 'dashboard' || activeTab === 'settings') ? '' : 'animate-fade-in-up'}>
              {activeTab === 'meetings' && (
                <MeetingsSection 
                  meetings={data.meetings}
                  updateMeetings={(m) => updateData('meetings', m)}
                />
              )}
              {activeTab === 'correspondence' && (
                <CorrespondenceSection
                  correspondence={data.correspondence}
                  contacts={data.contacts}
                  updateCorrespondence={(c) => updateData('correspondence', c)}
                />
              )}
              {activeTab === 'actionItems' && (
                <ActionItemsSection
                  actionItems={data.actionItems}
                  updateActionItems={(a) => updateData('actionItems', a)}
                />
              )}
              {activeTab === 'caseLog' && (
                <CaseLogSection
                  caseLog={data.caseLog}
                  updateCaseLog={(cl) => updateData('caseLog', cl)}
                />
              )}
              {activeTab === 'roster' && (
                <RosterSection
                  roster={data.committeeRoster}
                  updateRoster={(r) => updateData('committeeRoster', r)}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}