import { useCallback, useEffect, useState } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { Trash2 } from 'lucide-react';
import { COL, listDocs, patchDoc, removeDoc, saveDoc } from '../lib/db';
import { useAuth } from '../lib/auth';
import type { AdminRole, AdminUser } from '../lib/types';
import { ConfirmDialog, Field, Input, Panel, Select, Toggle, useToast } from './ui';

const ROLES: AdminRole[] = ['superadmin', 'admin', 'editor'];

/**
 * Creating the Auth account on a *secondary* Firebase app keeps the current
 * super admin signed in — the client SDK would otherwise swap the session.
 */
async function createAuthAccount(email: string, password: string): Promise<string> {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  const secondary = initializeApp(config, `admin-invite-${Date.now()}`);
  try {
    const secondaryAuth = getAuth(secondary);
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await signOut(secondaryAuth);
    return cred.user.uid;
  } finally {
    await deleteApp(secondary);
  }
}

export function UsersPage() {
  const { profile, can, changePassword } = useAuth();
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'editor' as AdminRole });
  const [creating, setCreating] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await listDocs<AdminUser>(COL.adminUsers)); }
    catch (e) { toast(e instanceof Error ? e.message : 'Could not load users', 'err'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { toast('Password must be at least 8 characters', 'err'); return; }
    setCreating(true);
    try {
      const uid = await createAuthAccount(form.email.trim(), form.password);
      await saveDoc(COL.adminUsers, uid, {
        email: form.email.trim(), name: form.name.trim(), role: form.role,
        active: true, createdAt: Date.now(),
      });
      toast('Admin user created');
      setForm({ email: '', password: '', name: '', role: 'editor' });
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message.replace('Firebase: ', '') : 'Could not create user', 'err');
    } finally { setCreating(false); }
  };

  const setRole = async (user: AdminUser, role: AdminRole) => {
    await patchDoc(COL.adminUsers, user.id, { role });
    setRows((s) => s.map((r) => (r.id === user.id ? { ...r, role } : r)));
    toast('Role updated');
  };

  const setActive = async (user: AdminUser, active: boolean) => {
    await patchDoc(COL.adminUsers, user.id, { active });
    setRows((s) => s.map((r) => (r.id === user.id ? { ...r, active } : r)));
  };

  const revoke = async (user: AdminUser) => {
    // Removes admin access. The Auth account itself is deleted from the Firebase console.
    await removeDoc(COL.adminUsers, user.id);
    setConfirm(null);
    toast('Admin access revoked');
    await load();
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 8) { toast('New password must be at least 8 characters', 'err'); return; }
    if (pw.next !== pw.confirm) { toast('Passwords do not match', 'err'); return; }
    try {
      await changePassword(pw.current, pw.next);
      setPw({ current: '', next: '', confirm: '' });
      toast('Password changed');
    } catch (err) {
      toast(err instanceof Error ? err.message.replace('Firebase: ', '') : 'Could not change password', 'err');
    }
  };

  return (
    <>
      <h1 className="font-display text-2xl mb-6">Admin users</h1>

      <Panel title="Your account">
        <p className="text-sm text-[#8C8C93] mb-5">
          Signed in as <span className="text-[#E6E3DD]">{profile?.email}</span> ({profile?.role}).
        </p>
        <form onSubmit={submitPassword} className="max-w-sm">
          <Field label="Current password">
            <Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" />
          </Field>
          <Field label="New password">
            <Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" />
          </Field>
          <Field label="Repeat new password">
            <Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" />
          </Field>
          <button type="submit" className="btn btn-ghost !py-2">Change password</button>
        </form>
      </Panel>

      {!can('manageUsers') ? (
        <Panel title="Team">
          <p className="text-sm text-[#8C8C93]">Only a super admin can manage the admin roster.</p>
        </Panel>
      ) : (
        <>
          <Panel title="Team">
            {loading ? (
              <p className="text-sm text-[#6A6A72] py-6 text-center">Loading…</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-[#6A6A72] border-b border-[#232327]">
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Role</th>
                    <th className="py-3 pr-4">Active</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => (
                    <tr key={u.id} className="border-b border-[#1A1A1D]">
                      <td className="py-3 pr-4 text-[#E6E3DD]">{u.email}</td>
                      <td className="py-3 pr-4 text-[#8C8C93]">{u.name || '—'}</td>
                      <td className="py-3 pr-4">
                        <Select value={u.role} className="!py-1 !px-2 text-xs !w-auto"
                                disabled={u.id === profile?.id}
                                onChange={(e) => void setRole(u, e.target.value as AdminRole)}>
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </Select>
                      </td>
                      <td className="py-3 pr-4">
                        <input type="checkbox" checked={u.active !== false} className="accent-[var(--accent)] w-4 h-4"
                               disabled={u.id === profile?.id}
                               onChange={(e) => void setActive(u, e.target.checked)} />
                      </td>
                      <td className="py-3">
                        {u.id !== profile?.id && (
                          <button type="button" onClick={() => setConfirm(u)} className="p-2 text-[#6A6A72] hover:text-red-400" aria-label="Revoke">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <Panel title="Add an admin user">
            <form onSubmit={create} className="max-w-md">
              <Field label="Email" required><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
              <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Temporary password" required hint="At least 8 characters. The user can change it after signing in.">
                <Input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </Field>
              <Field label="Role">
                <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </Select>
              </Field>
              <button type="submit" className="btn btn-primary !py-2" disabled={creating}>
                {creating ? 'Creating…' : 'Create user'}
              </button>
            </form>
          </Panel>
        </>
      )}

      {confirm && (
        <ConfirmDialog
          title={`Revoke admin access for ${confirm.email}?`}
          body="They lose access to the admin panel immediately. Their sign-in account still exists in the Firebase console until you delete it there."
          confirmLabel="Revoke"
          onCancel={() => setConfirm(null)}
          onConfirm={() => void revoke(confirm)}
        />
      )}
    </>
  );
}
