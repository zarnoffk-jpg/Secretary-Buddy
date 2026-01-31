import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, UserPlus, KeyRound, LockKeyhole, RefreshCw } from 'lucide-react';

interface LoginProps {
  hasAccount: boolean;
  onAuthenticate: (email: string, password: string) => Promise<boolean>;
  onCreateAccount: (email: string, password: string) => Promise<void>;
  onRecoverAccount: (vaultKey: string, newPassword: string, newEmail: string) => Promise<boolean>;
}

export const Login: React.FC<LoginProps> = ({ hasAccount, onAuthenticate, onCreateAccount, onRecoverAccount }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // State for the "Forgot Password" / Recovery view
  const [isRecovering, setIsRecovering] = useState(false);
  const [vaultKey, setVaultKey] = useState('');
  const [newLoginPass, setNewLoginPass] = useState('');
  const [confirmNewLoginPass, setConfirmNewLoginPass] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!hasAccount) {
        // Registration Logic
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        await onCreateAccount(email, password);
      } else {
        // Login Logic
        const success = await onAuthenticate(email, password);
        if (!success) {
          throw new Error("Invalid credentials.");
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
      setIsLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (newLoginPass.length < 6) throw new Error("New password must be at least 6 characters.");
      if (newLoginPass !== confirmNewLoginPass) throw new Error("New passwords do not match.");
      if (!newEmail.includes('@')) throw new Error("Please enter a valid email address.");
      
      const success = await onRecoverAccount(vaultKey, newLoginPass, newEmail);
      
      if (success) {
        setIsRecovering(false);
        setVaultKey('');
        setNewLoginPass('');
        setConfirmNewLoginPass('');
        setNewEmail('');
        setError('');
        alert("Account credentials updated successfully. Please log in with your new details.");
      } else {
        throw new Error("Incorrect Vault Key. Cannot verify identity.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // RECOVERY VIEW (Forgot Password)
  // --------------------------------------------------------------------------
  if (isRecovering) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-clay/20 shadow-2xl rounded-3xl p-10 animate-fade-in-up">
          <div className="w-16 h-16 bg-clay/10 text-clay rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-clay/10">
            <LockKeyhole size={32} />
          </div>
          
          <h1 className="text-2xl font-serif font-bold text-ink mb-2">
            Recover Account
          </h1>
          <p className="text-sm text-subtle mb-6 leading-relaxed">
            Enter your <strong>Vault Key</strong> to prove ownership. If correct, you can set a new login password and email.
          </p>

          <form onSubmit={handleRecovery} className="space-y-4">
            <div className="group bg-paper/50 focus-within:bg-white border border-sand/50 focus-within:border-clay/50 focus-within:shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
                <label className="block px-4 pt-3 pb-1 text-[10px] font-bold text-subtle/70 uppercase tracking-[0.15em]">Vault Key (Data Password)</label>
                <input 
                  type="password"
                  className="w-full bg-transparent border-none px-4 pt-0 pb-3 text-ink font-medium focus:ring-0 text-base"
                  value={vaultKey}
                  onChange={(e) => setVaultKey(e.target.value)}
                  placeholder="Enter vault password"
                  required
                />
            </div>

            <div className="group bg-paper/50 focus-within:bg-white border border-sand/50 focus-within:border-ink/20 focus-within:shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
                <label className="block px-4 pt-3 pb-1 text-[10px] font-bold text-subtle/70 uppercase tracking-[0.15em]">New Email Address</label>
                <input 
                  type="email"
                  className="w-full bg-transparent border-none px-4 pt-0 pb-3 text-ink font-medium focus:ring-0 text-base"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="new@example.com"
                  required
                />
            </div>

            <div className="group bg-paper/50 focus-within:bg-white border border-sand/50 focus-within:border-ink/20 focus-within:shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
                <label className="block px-4 pt-3 pb-1 text-[10px] font-bold text-subtle/70 uppercase tracking-[0.15em]">New Login Password</label>
                <input 
                  type="password"
                  className="w-full bg-transparent border-none px-4 pt-0 pb-3 text-ink font-medium focus:ring-0 text-base"
                  value={newLoginPass}
                  onChange={(e) => setNewLoginPass(e.target.value)}
                  placeholder="New login password"
                  required
                />
            </div>

            <div className="group bg-paper/50 focus-within:bg-white border border-sand/50 focus-within:border-ink/20 focus-within:shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
                <label className="block px-4 pt-3 pb-1 text-[10px] font-bold text-subtle/70 uppercase tracking-[0.15em]">Confirm New Password</label>
                <input 
                  type="password"
                  className="w-full bg-transparent border-none px-4 pt-0 pb-3 text-ink font-medium focus:ring-0 text-base"
                  value={confirmNewLoginPass}
                  onChange={(e) => setConfirmNewLoginPass(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
            </div>

            {error && (
              <div className="text-red-500 text-sm font-medium animate-pulse bg-red-50 p-3 rounded-xl border border-red-100">{error}</div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 bg-clay text-white font-bold rounded-2xl shadow-lg hover:shadow-clay/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? 'Verifying...' : <><RefreshCw size={18} /> Update Credentials</>}
            </button>
            
            <button 
              type="button"
              onClick={() => setIsRecovering(false)}
              className="w-full py-4 bg-transparent text-subtle font-bold rounded-2xl hover:bg-sand/30 transition-all"
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // LOGIN / REGISTER VIEW
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl p-10 animate-fade-in-up">
        
        <div className="w-16 h-16 bg-ink text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          {hasAccount ? <ShieldCheck size={32} /> : <UserPlus size={32} />}
        </div>
        
        <h1 className="text-3xl font-serif font-bold text-ink mb-2">
          {hasAccount ? 'Secretary Buddy' : 'Welcome'}
        </h1>
        <p className="text-subtle mb-8">
          {hasAccount 
            ? 'Please sign in to access the secure workspace.' 
            : 'Create your owner account to secure this device.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="group bg-paper/50 focus-within:bg-white border border-sand/50 focus-within:border-ink/20 focus-within:shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
            <label className="block px-4 pt-3 pb-1 text-[10px] font-bold text-subtle/70 uppercase tracking-[0.15em]">Email</label>
            <input 
              type="email"
              className="w-full bg-transparent border-none px-4 pt-0 pb-3 text-ink font-medium focus:ring-0 text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="group bg-paper/50 focus-within:bg-white border border-sand/50 focus-within:border-ink/20 focus-within:shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
            <label className="block px-4 pt-3 pb-1 text-[10px] font-bold text-subtle/70 uppercase tracking-[0.15em]">Password</label>
            <input 
              type="password"
              className="w-full bg-transparent border-none px-4 pt-0 pb-3 text-ink font-medium focus:ring-0 text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {!hasAccount && (
            <div className="group bg-paper/50 focus-within:bg-white border border-sand/50 focus-within:border-ink/20 focus-within:shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
              <label className="block px-4 pt-3 pb-1 text-[10px] font-bold text-subtle/70 uppercase tracking-[0.15em]">Confirm Password</label>
              <input 
                type="password"
                className="w-full bg-transparent border-none px-4 pt-0 pb-3 text-ink font-medium focus:ring-0 text-base"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          )}
          
          {error && (
            <div className="text-red-500 text-sm font-medium animate-pulse bg-red-50 p-3 rounded-xl border border-red-100">{error}</div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 bg-ink text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              'Processing...'
            ) : (
              <>
                {hasAccount ? 'Sign In' : 'Create Account'} 
                {hasAccount ? <ArrowRight size={18} /> : <KeyRound size={18} />}
              </>
            )}
          </button>
        </form>

        {hasAccount && (
            <div className="mt-6">
                <button 
                    onClick={() => setIsRecovering(true)}
                    className="text-xs text-subtle hover:text-clay underline decoration-dotted transition-colors"
                >
                    Forgot password or need to reset?
                </button>
            </div>
        )}

        <div className={`pt-6 border-t border-sand/30 ${hasAccount ? 'mt-6' : 'mt-8'}`}>
             <p className="text-xs text-subtle opacity-60">
                {hasAccount 
                  ? 'Protected by client-side AES-GCM encryption.' 
                  : 'Credentials are stored securely on this device.'}
             </p>
        </div>
      </div>
    </div>
  );
};