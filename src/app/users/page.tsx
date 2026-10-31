'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { useI18n } from '@/lib/i18n';
import { User, UserRole } from '@/lib/types';
import { formatDate } from '@/lib/utils/format';
import { Users as UsersIcon, UserPlus, KeyRound, Shield, CheckCircle2, AlertCircle, X } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => (res.ok ? res.json() : null));

export default function UsersPage() {
  const { t } = useI18n();

  const { data, isLoading } = useSWR('/api/users', fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
  });

  const users: User[] = data?.users || [];

  // Create User Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Reset Password State
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          full_name: fullName,
          password,
          role,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setCreateError(resData.error || 'Failed to create user');
        setCreateLoading(false);
        return;
      }

      setShowCreateModal(false);
      setUsername('');
      setFullName('');
      setPassword('');
      mutate('/api/users');
    } catch {
      setCreateError('An unexpected error occurred.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      if (res.ok) {
        mutate('/api/users');
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !newPassword) return;
    setResetLoading(true);

    try {
      const res = await fetch(`/api/users/${resetTargetUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      if (res.ok) {
        setResetMsg(`Password reset for ${resetTargetUser.username}!`);
        setTimeout(() => {
          setResetTargetUser(null);
          setNewPassword('');
          setResetMsg(null);
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to reset password:', err);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#1E0D12] p-5 sm:p-6 rounded-3xl shadow-sm border border-[#EFE4D3] dark:border-[#3A1B23]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#7A1626] text-white flex items-center justify-center shadow-md">
            <UsersIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#7A1626] dark:text-[#E5B84B]">
                {t.nav.users}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                Owner Only
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Manage shop desk staff accounts, credentials, and access permissions
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7A1626] hover:bg-[#5B0E1B] text-white text-xs sm:text-sm font-semibold shadow-md transition-all shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t.buttons.createUser}</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#1E0D12] rounded-3xl shadow-sm border border-[#EFE4D3] dark:border-[#3A1B23] overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-500">Loading user accounts...</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FBF6EF] dark:bg-[#140A0D] border-b border-[#EFE4D3] dark:border-[#3A1B23] text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Must Change Password</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60 dark:hover:bg-[#180A0E] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                        {u.full_name}
                      </div>
                      <div className="text-gray-500 font-mono text-[11px]">@{u.username}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.role === 'owner'
                            ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                            : 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        }`}
                      >
                        {u.role === 'owner' ? '👑 Owner' : '👤 Staff'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.is_active
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-gray-500">
                      {u.must_change_password ? (
                        <span className="text-amber-600 font-medium">Yes (Forced on login)</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">
                      {formatDate(u.created_at)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Reset Password Button */}
                        <button
                          type="button"
                          onClick={() => setResetTargetUser(u)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[11px] font-semibold hover:bg-amber-100 transition-colors"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>Reset</span>
                        </button>

                        {/* Toggle Active/Inactive */}
                        {u.role !== 'owner' && (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(u)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                              u.is_active
                                ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                            }`}
                          >
                            {u.is_active ? t.buttons.deactivate : t.buttons.activate}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#1E0D12] rounded-3xl shadow-2xl border border-[#EFE4D3] dark:border-[#3A1B23] p-6 sm:p-8 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif font-bold text-lg sm:text-xl text-[#7A1626] dark:text-[#E5B84B] mb-1">
              Add New Staff User
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              Staff will be forced to change their temporary password upon their first login.
            </p>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{createError}</p>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-[#7A1626]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ramesh_staff"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-[#7A1626]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Temporary Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Temporary password"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-[#7A1626]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-[#7A1626]"
                >
                  <option value="staff">Staff (Orders, Dispatch, Tracking)</option>
                  <option value="owner">Owner (Full System Access)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#7A1626] hover:bg-[#5B0E1B] rounded-xl shadow-md disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#1E0D12] rounded-3xl shadow-2xl border border-[#EFE4D3] dark:border-[#3A1B23] p-6 relative">
            <button
              onClick={() => setResetTargetUser(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif font-bold text-base text-[#7A1626] dark:text-[#E5B84B] mb-1">
              Reset Password
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Enter a new password for @{resetTargetUser.username}:
            </p>

            {resetMsg && (
              <div className="mb-3 p-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <p>{resetMsg}</p>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3">
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New temporary password"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-xs outline-none focus:ring-2 focus:ring-[#7A1626]"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#7A1626] rounded-xl shadow-md disabled:opacity-50"
                >
                  {resetLoading ? 'Resetting...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
