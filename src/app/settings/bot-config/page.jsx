"use client";

import { useEffect, useState } from 'react';

export default function BotConfigPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/bot/config')
      .then((r) => r.json())
      .then((data) => {
        setConfig(data.config || {});
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/bot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save');
      setConfig(data.config);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-400">{error}</div>;

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Bot Configuration</h1>
      <label className="block mb-4">
        <span className="text-sm text-gray-300">Max Daily Trades</span>
        <input type="number" value={config.max_daily_trades || 10} onChange={(e) => setConfig({ ...config, max_daily_trades: parseInt(e.target.value || 0) })} className="mt-1 block w-full bg-[#0B1120] border border-gray-700 rounded p-2 text-white" />
      </label>

      <label className="block mb-4">
        <span className="text-sm text-gray-300">Max Position Size</span>
        <input type="number" value={config.max_position_size || 1000} onChange={(e) => setConfig({ ...config, max_position_size: parseFloat(e.target.value || 0) })} className="mt-1 block w-full bg-[#0B1120] border border-gray-700 rounded p-2 text-white" />
      </label>

      <label className="block mb-4">
        <span className="text-sm text-gray-300">Auto Trading Enabled</span>
        <input type="checkbox" checked={!!config.auto_trading_enabled} onChange={(e) => setConfig({ ...config, auto_trading_enabled: e.target.checked })} className="ml-2" />
      </label>

      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="bg-blue-500 px-4 py-2 rounded text-white">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </div>
  );
}
