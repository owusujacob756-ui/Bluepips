'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Play,
  Square,
  BarChart3,
  Plus,
  Trash2,
  RefreshCw,
} from 'lucide-react';

export default function MT5Dashboard() {
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [formData, setFormData] = useState({
    accountLogin: '',
    accountPassword: '',
    brokerName: 'ICMarkets',
    accountType: 'demo',
    accountBalance: 0,
  });

  const queryClient = useQueryClient();

  // Fetch MT5 accounts
  const { data: accountsData, isLoading: accountsLoading } = useQuery({
    queryKey: ['mt5-accounts'],
    queryFn: async () => {
      const res = await fetch('/api/mt5/accounts');
      return res.json();
    },
  });

  // Fetch account info
  const { data: accountInfo } = useQuery({
    queryKey: ['mt5-account', selectedAccount],
    queryFn: async () => {
      if (!selectedAccount) return null;
      const res = await fetch(`/api/mt5/accounts/${selectedAccount}`);
      return res.json();
    },
    enabled: !!selectedAccount,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch bot stats
  const { data: botStats } = useQuery({
    queryKey: ['mt5-bot-stats', selectedAccount],
    queryFn: async () => {
      if (!selectedAccount) return null;
      const res = await fetch(`/api/mt5/accounts/${selectedAccount}/bot/stats`);
      return res.json();
    },
    enabled: !!selectedAccount,
    refetchInterval: 60000, // Refresh every 60 seconds
  });

  // Register account mutation
  const registerAccountMutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch('/api/mt5/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mt5-accounts'] });
      setFormData({
        accountLogin: '',
        accountPassword: '',
        brokerName: 'ICMarkets',
        accountType: 'demo',
        accountBalance: 0,
      });
      setShowAddAccount(false);
    },
  });

  // Start bot mutation
  const startBotMutation = useMutation({
    mutationFn: async (accountId) => {
      const res = await fetch(`/api/mt5/accounts/${accountId}/bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mt5-account'] });
    },
  });

  // Stop bot mutation
  const stopBotMutation = useMutation({
    mutationFn: async (accountId) => {
      const res = await fetch(`/api/mt5/accounts/${accountId}/bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mt5-account'] });
    },
  });

  // Sync orders mutation
  const syncOrdersMutation = useMutation({
    mutationFn: async (accountId) => {
      const res = await fetch(`/api/mt5/accounts/${accountId}/sync`, {
        method: 'POST',
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mt5-orders'] });
    },
  });

  const handleAddAccount = async (e) => {
    e.preventDefault();
    registerAccountMutation.mutate(formData);
  };

  const accounts = accountsData?.accounts || [];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">MetaTrader 5 Integration</h1>
            <p className="text-gray-400">Real account trading with automated signals</p>
          </div>
          <button
            onClick={() => setShowAddAccount(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            <Plus size={20} /> Add Account
          </button>
        </div>

        {/* Add Account Modal */}
        {showAddAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Add MT5 Account</h2>
              <form onSubmit={handleAddAccount} className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Account Login</label>
                  <input
                    type="text"
                    value={formData.accountLogin}
                    onChange={(e) =>
                      setFormData({ ...formData, accountLogin: e.target.value })
                    }
                    className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Account Password</label>
                  <input
                    type="password"
                    value={formData.accountPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, accountPassword: e.target.value })
                    }
                    className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Broker</label>
                  <select
                    value={formData.brokerName}
                    onChange={(e) =>
                      setFormData({ ...formData, brokerName: e.target.value })
                    }
                    className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                  >
                    <option value="ICMarkets">IC Markets</option>
                    <option value="Exness">Exness</option>
                    <option value="Pepperstone">Pepperstone</option>
                    <option value="FxPro">FxPro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">Account Type</label>
                  <select
                    value={formData.accountType}
                    onChange={(e) =>
                      setFormData({ ...formData, accountType: e.target.value })
                    }
                    className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                  >
                    <option value="demo">Demo</option>
                    <option value="live">Live</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">Initial Balance (USD)</label>
                  <input
                    type="number"
                    value={formData.accountBalance}
                    onChange={(e) =>
                      setFormData({ ...formData, accountBalance: parseFloat(e.target.value) })
                    }
                    className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={registerAccountMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {registerAccountMutation.isPending ? 'Adding...' : 'Add Account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddAccount(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Accounts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {accountsLoading ? (
            <div className="text-gray-400">Loading accounts...</div>
          ) : accounts.length === 0 ? (
            <div className="text-gray-400">No accounts connected yet</div>
          ) : (
            accounts.map((account) => (
              <div
                key={account.id}
                onClick={() => setSelectedAccount(account.id)}
                className={`bg-gray-800 border-2 rounded-lg p-4 cursor-pointer transition ${
                  selectedAccount === account.id
                    ? 'border-blue-500'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{account.account_login}</h3>
                    <p className="text-sm text-gray-400">{account.broker_name}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      account.account_type === 'live'
                        ? 'bg-red-900 text-red-200'
                        : 'bg-green-900 text-green-200'
                    }`}
                  >
                    {account.account_type}
                  </span>
                </div>
                <div className="bg-gray-700 rounded p-3 mt-3">
                  <p className="text-sm text-gray-400">Balance</p>
                  <p className="text-xl font-bold text-green-400">
                    ${account.account_balance?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Account Details */}
        {selectedAccount && accountInfo?.account && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Account Info */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">Account Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Balance</p>
                    <p className="text-2xl font-bold text-green-400">
                      ${accountInfo.account.balance?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Equity</p>
                    <p className="text-2xl font-bold text-blue-400">
                      ${accountInfo.account.equity?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Margin Used</p>
                    <p className="text-lg font-semibold">
                      ${accountInfo.account.marginUsed?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Margin Free</p>
                    <p className="text-lg font-semibold">
                      ${accountInfo.account.marginFree?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Margin Level</p>
                    <p className="text-lg font-semibold">
                      {accountInfo.account.marginLevel?.toFixed(2) || '0'}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Leverage</p>
                    <p className="text-lg font-semibold">
                      1:{accountInfo.account.leverage || '100'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => syncOrdersMutation.mutate(selectedAccount)}
                    disabled={syncOrdersMutation.isPending}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    <RefreshCw size={16} />
                    Sync Orders
                  </button>
                </div>
              </div>

              {/* Performance Stats */}
              {botStats?.stats && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <BarChart3 size={20} /> Performance Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Total Trades</p>
                      <p className="text-2xl font-bold">{botStats.stats.totalTrades}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Win Rate</p>
                      <p className="text-2xl font-bold text-green-400">
                        {botStats.stats.winRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Total Profit</p>
                      <p className={`text-2xl font-bold ${botStats.stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${botStats.stats.totalProfit.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Avg Trade</p>
                      <p className={`text-2xl font-bold ${botStats.stats.averageProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${botStats.stats.averageProfit.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bot Control */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Settings size={20} /> Auto Trading Bot
              </h3>

              <div className="space-y-4">
                <div className="bg-gray-700 rounded p-3">
                  <p className="text-sm text-gray-400 mb-2">Bot Status</p>
                  <p className="font-bold">
                    <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    Running
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startBotMutation.mutate(selectedAccount)}
                    disabled={startBotMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    <Play size={16} /> Start
                  </button>
                  <button
                    onClick={() => stopBotMutation.mutate(selectedAccount)}
                    disabled={stopBotMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    <Square size={16} /> Stop
                  </button>
                </div>

                <div className="bg-gray-700 rounded p-3 mt-4">
                  <p className="text-sm text-gray-400 mb-3">Bot Settings</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Max Trades:</span>
                      <span className="font-bold">5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Risk %:</span>
                      <span className="font-bold">2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Leverage:</span>
                      <span className="font-bold">1:10</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
