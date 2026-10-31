'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { useI18n } from '@/lib/i18n';
import { MasterItem, MasterCategory } from '@/lib/types';
import { Settings as SettingsIcon, Plus, Trash2, CheckCircle2, Shield, AlertCircle } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => (res.ok ? res.json() : null));

export default function SettingsPage() {
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<MasterCategory>('courier');
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useSWR(`/api/masters?category=${activeTab}`, fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
  });

  const items: MasterItem[] = data?.items || [];

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/masters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: activeTab, name: newItemName.trim() }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to add item');
      } else {
        setNewItemName('');
        mutate(`/api/masters?category=${activeTab}`);
        mutate('/api/masters');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/masters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current }),
      });
      if (res.ok) {
        mutate(`/api/masters?category=${activeTab}`);
        mutate('/api/masters');
      }
    } catch (err) {
      console.error('Failed to toggle item:', err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this master item?')) return;
    try {
      const res = await fetch(`/api/masters/${id}`, { method: 'DELETE' });
      if (res.ok) {
        mutate(`/api/masters?category=${activeTab}`);
        mutate('/api/masters');
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#1E0D12] p-5 sm:p-6 rounded-3xl shadow-sm border border-[#EFE4D3] dark:border-[#3A1B23]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#7A1626] text-white flex items-center justify-center shadow-md">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#7A1626] dark:text-[#E5B84B]">
                {t.nav.settings}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                Owner Only
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Manage Master Data: Couriers, Delivery Cities, and Sweet Products
            </p>
          </div>
        </div>
      </div>

      {/* Settings Container */}
      <div className="bg-white dark:bg-[#1E0D12] rounded-3xl shadow-sm border border-[#EFE4D3] dark:border-[#3A1B23] p-6 sm:p-8">
        {/* Master Category Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
          {(['courier', 'city', 'product'] as MasterCategory[]).map((cat) => {
            const isActive = activeTab === cat;
            const label = cat === 'courier' ? 'Couriers' : cat === 'city' ? 'Delivery Cities' : 'Sweet Box Products';

            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveTab(cat);
                  setError(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#7A1626] text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Add New Master Item */}
        <form onSubmit={handleAddItem} className="flex gap-2 max-w-md mb-6">
          <input
            type="text"
            required
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder={`Add new ${activeTab}...`}
            className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#7A1626]"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7A1626] hover:bg-[#5B0E1B] text-white text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>

        {/* Master Items List */}
        {isLoading ? (
          <div className="py-8 text-center text-xs text-gray-400">Loading master items...</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">No items found in this category.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FBF6EF]/50 dark:bg-[#160A0D] border border-[#EFE4D3] dark:border-[#3A1B23]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${item.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}
                  />
                  <span
                    className={`text-xs font-semibold ${
                      item.is_active ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 line-through'
                    }`}
                  >
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(item.id, item.is_active)}
                    className="text-[11px] font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 px-2 py-0.5 rounded hover:bg-black/5"
                  >
                    {item.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
