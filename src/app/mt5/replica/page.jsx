/**
 * MT5 Replica Trading Dashboard
 * Main trading interface with live market data, positions, orders, and history
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MT5ReplicaDashboard() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [prices, setPrices] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('positions'); // positions, orders, history, stats

  // Fetch accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Refresh data when account changes
  useEffect(() => {
    if (selectedAccount) {
      fetchPositions();
      fetchOrders();
      fetchStats();
      fetchPrices();
      
      // Auto-refresh every 5 seconds
      const interval = setInterval(() => {
        fetchPositions();
        fetchPrices();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [selectedAccount]);

  async function fetchAccounts() {
    try {
      const res = await fetch('/api/mt5/replica/accounts');
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts);
        if (data.accounts.length > 0) {
          setSelectedAccount(data.accounts[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPositions() {
    if (!selectedAccount) return;
    try {
      const res = await fetch(`/api/mt5/replica/positions?accountId=${selectedAccount}`);
      const data = await res.json();
      if (data.success) {
        setPositions(data.positions);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  }

  async function fetchOrders() {
    if (!selectedAccount) return;
    try {
      const res = await fetch(`/api/mt5/replica/orders?accountId=${selectedAccount}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }

  async function fetchStats() {
    if (!selectedAccount) return;
    try {
      const res = await fetch(`/api/mt5/replica/history?accountId=${selectedAccount}&type=stats`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  async function fetchPrices() {
    try {
      const res = await fetch('/api/mt5/replica/prices');
      const data = await res.json();
      if (data.success) {
        setPrices(data.prices);
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  }

  async function createAccount() {
    const name = prompt('Enter account name:');
    if (!name) return;

    try {
      const res = await fetch('/api/mt5/replica/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName: name,
          initialBalance: 10000,
          leverage: 100,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAccounts();
      }
    } catch (error) {
      console.error('Error creating account:', error);
    }
  }

  async function placeOrder(symbol, orderType, volume) {
    if (!selectedAccount) return;

    try {
      const res = await fetch('/api/mt5/replica/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccount,
          symbol,
          orderType,
          volume,
          stopLoss: null,
          takeProfit: null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
        fetchPositions();
      }
    } catch (error) {
      console.error('Error placing order:', error);
    }
  }

  async function closePosition(positionId) {
    if (!selectedAccount) return;

    try {
      const res = await fetch('/api/mt5/replica/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPositions();
        fetchStats();
      }
    } catch (error) {
      console.error('Error closing position:', error);
    }
  }

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  const accountData = accounts.find(a => a.id === selectedAccount);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">MT5 Replica Simulator</h1>
          <button
            onClick={createAccount}
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
          >
            Create Account
          </button>
        </div>

        {/* Account Selector */}
        <div className="bg-gray-800 rounded p-4 mb-6">
          <div className="flex gap-2 mb-4">
            {accounts.map(acc => (
              <button
                key={acc.id}
                onClick={() => setSelectedAccount(acc.id)}
                className={`px-4 py-2 rounded ${
                  selectedAccount === acc.id
                    ? 'bg-blue-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {acc.account_name}
              </button>
            ))}
          </div>

          {accountData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Balance</div>
                <div className="font-bold">${accountData.current_balance?.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-400">Equity</div>
                <div className="font-bold">${(accountData.current_balance || 0).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-400">Leverage</div>
                <div className="font-bold">1:{accountData.leverage}</div>
              </div>
              <div>
                <div className="text-gray-400">Open Positions</div>
                <div className="font-bold">{positions.length}</div>
              </div>
            </div>
          )}
        </div>

        {/* Market Data & Trading */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Market Watch */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded p-4">
              <h2 className="text-xl font-bold mb-4">Market Watch</h2>
              <div className="space-y-2">
                {Object.entries(prices).slice(0, 6).map(([symbol, data]) => (
                  <div
                    key={symbol}
                    className="flex justify-between items-center p-2 bg-gray-700 rounded"
                  >
                    <div>
                      <div className="font-semibold">{symbol}</div>
                      <div className="text-sm text-gray-400">
                        B: {data.bid?.toFixed(5)} A: {data.ask?.toFixed(5)}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => placeOrder(symbol, 'buy', 0.1)}
                        className="bg-green-600 px-2 py-1 rounded text-xs hover:bg-green-700"
                      >
                        BUY
                      </button>
                      <button
                        onClick={() => placeOrder(symbol, 'sell', 0.1)}
                        className="bg-red-600 px-2 py-1 rounded text-xs hover:bg-red-700"
                      >
                        SELL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-2 mb-4 bg-gray-800 rounded p-2">
              {['positions', 'orders', 'history', 'stats'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded capitalize ${
                    activeTab === tab
                      ? 'bg-blue-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Positions Tab */}
            {activeTab === 'positions' && (
              <div className="bg-gray-800 rounded p-4">
                <h3 className="text-lg font-bold mb-3">Open Positions</h3>
                {positions.length === 0 ? (
                  <p className="text-gray-400">No open positions</p>
                ) : (
                  <div className="space-y-2">
                    {positions.map(pos => (
                      <div
                        key={pos.id}
                        className="bg-gray-700 p-3 rounded flex justify-between items-center"
                      >
                        <div>
                          <div className="font-semibold">
                            {pos.type.toUpperCase()} {pos.volume} {pos.symbol}
                          </div>
                          <div className="text-sm text-gray-400">
                            Entry: {pos.entry_price?.toFixed(5)} | 
                            Current: {pos.currentPrice?.toFixed(5)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-bold ${
                              pos.unrealizedPnL >= 0
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}
                          >
                            ${pos.unrealizedPnL?.toFixed(2)}
                          </div>
                          <button
                            onClick={() => closePosition(pos.id)}
                            className="bg-red-600 px-3 py-1 rounded text-xs hover:bg-red-700 mt-1"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-gray-800 rounded p-4">
                <h3 className="text-lg font-bold mb-3">Orders</h3>
                {orders.length === 0 ? (
                  <p className="text-gray-400">No orders</p>
                ) : (
                  <div className="space-y-2">
                    {orders.map(order => (
                      <div key={order.id} className="bg-gray-700 p-3 rounded">
                        <div className="font-semibold">{order.order_type.toUpperCase()} {order.symbol}</div>
                        <div className="text-sm text-gray-400">
                          Status: {order.status} | Volume: {order.volume} | Price: {order.entry_price?.toFixed(5)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && stats && (
              <div className="bg-gray-800 rounded p-4">
                <h3 className="text-lg font-bold mb-3">Performance Statistics</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-700 p-2 rounded">
                    <div className="text-gray-400">Total Trades</div>
                    <div className="font-bold">{stats.totalTrades}</div>
                  </div>
                  <div className="bg-gray-700 p-2 rounded">
                    <div className="text-gray-400">Win Rate</div>
                    <div className="font-bold text-green-400">{stats.winRate}%</div>
                  </div>
                  <div className="bg-gray-700 p-2 rounded">
                    <div className="text-gray-400">Total P&L</div>
                    <div className={`font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${stats.totalPnL?.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-gray-700 p-2 rounded">
                    <div className="text-gray-400">Best Trade</div>
                    <div className="font-bold text-green-400">${stats.bestTrade?.toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-700 p-2 rounded">
                    <div className="text-gray-400">Avg P&L</div>
                    <div className="font-bold">${stats.avgPnL?.toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-700 p-2 rounded">
                    <div className="text-gray-400">Worst Trade</div>
                    <div className="font-bold text-red-400">${stats.worstTrade?.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm">
          <p>
            MT5 Replica Simulator - Demo trading platform. 
            <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 ml-2">
              Back to Dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
