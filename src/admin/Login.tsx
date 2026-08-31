import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { firebaseConfigured } from '../lib/firebase';
import { Field, Input } from './ui';

export function Login() {
  const { login, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setNotice(''); setBusy(true);
    try { await login(email, password); }
    catch (err) { setError(err instanceof Error ? err.message.replace('Firebase: ', '') : 'Login failed'); }
    finally { setBusy(false); }
  };

  const forgot = async () => {
    if (!email.trim()) { setError('Enter your email address first.'); return; }
    try {
      await resetPassword(email);
      setNotice('Password reset email sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message.replace('Firebase: ', '') : 'Could not send reset email');
    }
  };

  return (
    <div className="min-h-screen admin-shell grid place-items-center px-5">
      <div className="w-full max-w-sm">
        <p className="eyebrow mb-8">Administration</p>
        <h1 className="font-display text-2xl mb-8">Sign in</h1>

        {!firebaseConfigured && (
          <p className="text-sm text-[#C2903C] border border-[#3a3020] bg-[#1a150c] p-4 mb-6">
            Firebase is not configured. Copy <code>.env.example</code> to <code>.env</code> and fill in the project keys.
          </p>
        )}

        <form onSubmit={submit}>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
          </Field>
          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </Field>
          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
          {notice && <p className="text-sm text-[#5FA97A] mb-4">{notice}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={busy || !firebaseConfigured}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <button type="button" onClick={() => void forgot()} className="text-xs text-[#6A6A72] hover:text-[#E6E3DD] mt-5">
          Forgot password?
        </button>
      </div>
    </div>
  );
}
