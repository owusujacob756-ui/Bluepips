"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Bell, 
  Settings, 
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
  Star,
  AlertTriangle
} from "lucide-react";

// API fetch functions
const fetchDashboardStats = async () => {
  const response = await fetch('/api/dashboard/stats');
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
};

const fetchActiveSignals = async () => {
  const response = await fetch('/api/signals/active');
  if (!response.ok) throw new Error('Failed to fetch signals');
  return response.json();
};

const fetchTrades = async () => {
  const response = await fetch('/api/trades/history?status=open');
  if (!response.ok) throw new Error('Failed to fetch trades');
  return response.json();
};

const fetchPairs = async () => {
  const response = await fetch('/api/forex/pairs');
  if (!response.ok) throw new Error('Failed to fetch pairs');
  return response.json();
};

export default function DashboardPage() {
  const [showBalance, setShowBalance] = useState(true);

  const { data: stats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: signals } = useQuery({
    queryKey: ['activeSignals'],
    queryFn: fetchActiveSignals,
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: trades } = useQuery({
    queryKey: ['openTrades'],
    queryFn: fetchTrades,
    refetchInterval: 30000,
  });

  const { data: pairs } = useQuery({
    queryKey: ['forexPairs'],
    queryFn: fetchPairs,
    refetchInterval: 60000,
  });

  const fetchLatestAnalyses = async () => {
    const response = await fetch('/api/analysis/latest');
    if (!response.ok) throw new Error('Failed to fetch analyses');
    return response.json();
  };

  const fetchNews = async () => {
    const response = await fetch('/api/news/recent');
    if (!response.ok) throw new Error('Failed to fetch news');
    return response.json();
  };

  const { data: analyses } = useQuery({
    queryKey: ['latestAnalyses'],
    queryFn: fetchLatestAnalyses,
    refetchInterval: 60000,
  });

  const { data: news } = useQuery({
    queryKey: ['recentNews'],
    queryFn: fetchNews,
    refetchInterval: 60000,
  });

  return (
    <div className="min-h-screen bg-[#0B1120] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Bluepips Dashboard</h1>
            <p className="text-gray-400">AI-powered forex trading platform</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 bg-[#151F2E] rounded-lg hover:bg-[#1a2332] transition-colors">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 bg-[#151F2E] rounded-lg hover:bg-[#1a2332] transition-colors">
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#151F2E] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                {showBalance ? <Eye className="w-4 h-4 text-gray-400" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {showBalance ? `$${stats?.totalPL?.toFixed(2) || '0.00'}` : '****'}
            </div>
            <div className="text-sm text-gray-400">Total P&L</div>
            <div className={`text-xs mt-2 ${stats?.totalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats?.totalPL >= 0 ? <ArrowUpRight className="inline w-3 h-3" /> : <ArrowDownRight className="inline w-3 h-3" />}
              {Math.abs(stats?.totalPL || 0).toFixed(2)} today
            </div>
          </div>

          <div className="bg-[#151F2E] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Activity className="w-5 h-5 text-green-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stats?.winRate?.toFixed(1) || '0.0'}%
            </div>
            <div className="text-sm text-gray-400">Win Rate</div>
            <div className="text-xs mt-2 text-green-400">
              <ArrowUpRight className="inline w-3 h-3" />
              Above average
            </div>
          </div>

          <div className="bg-[#151F2E] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Star className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stats?.totalTrades || 0}
            </div>
            <div className="text-sm text-gray-400">Total Trades</div>
            <div className="text-xs mt-2 text-gray-400">
              {trades?.summary?.openTrades || 0} open
            </div>
          </div>

          <div className="bg-[#151F2E] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stats?.activeSignals || 0}
            </div>
            <div className="text-sm text-gray-400">Active Signals</div>
            <div className="text-xs mt-2 text-yellow-400">
              High confidence
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Signals */}
          <div className="lg:col-span-2 bg-[#151F2E] border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Active Trading Signals
            </h2>

            {signals?.signals?.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">No active signals</div>
                <div className="text-sm text-gray-500">AI is analyzing markets for opportunities</div>
              </div>
            ) : (
              <div className="space-y-4">
                {signals?.signals?.map((signal) => (
                  <div key={signal.id} className="bg-[#1a2332] border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          signal.signal_type === 'buy' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {signal.signal_type.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-semibold">{signal.symbol}</div>
                          <div className="text-sm text-gray-400">{signal.pair_name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{signal.confidence}%</div>
                        <div className="text-xs text-gray-400">Confidence</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-gray-400">Entry</div>
                        <div className="text-sm text-white">{signal.entry_price}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Stop Loss</div>
                        <div className="text-sm text-red-400">{signal.stop_loss}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Take Profit</div>
                        <div className="text-sm text-green-400">{signal.take_profit}</div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-xs text-gray-400 mb-1">Pattern: {signal.pattern_detected}</div>
                      <div className="text-xs text-gray-300">{signal.timeframe} timeframe</div>
                    </div>

                    {signal.technical_indicators && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {Object.entries(JSON.parse(signal.technical_indicators)).slice(0, 3).map(([key, value]) => (
                          <div key={key} className="bg-[#0B1120] px-3 py-1 rounded text-xs">
                            <span className="text-gray-400">{key}:</span>{" "}
                            <span className="text-white">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 rounded-lg font-semibold transition-all">
                      Execute Trade
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Market Overview */}
          <div className="bg-[#151F2E] border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Market Overview
            </h2>

            <div className="mb-4">
              <h3 className="text-sm text-gray-400 mb-2">AI Analysis</h3>
              <div className="grid grid-cols-1 gap-2">
                {analyses?.analyses?.slice(0,5).map((a) => (
                  <div key={a.id} className="bg-[#1a2332] border border-gray-700 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="text-white font-semibold">{a.symbol}</div>
                      <div className="text-xs text-gray-400">{a.details?.tech?.summary || a.details?.ai?.summary || 'AI summary not available'}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${a.overall_recommendation === 'buy' ? 'text-green-400' : a.overall_recommendation === 'sell' ? 'text-red-400' : 'text-gray-400'}`}>
                        {a.overall_recommendation ? a.overall_recommendation.toUpperCase() : 'HOLD'}
                      </div>
                      <div className="text-xs text-gray-400">{a.confidence ? a.confidence + '%' : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm text-gray-400 mb-2">Latest News</h3>
              <div className="space-y-2 max-h-48 overflow-auto">
                {news?.news?.slice(0,5).map((n) => (
                  <a key={n.id} href={n.url || '#'} className="block bg-[#1a2332] border border-gray-700 rounded-lg p-3 hover:border-blue-500/50 transition-all" target="_blank" rel="noreferrer">
                    <div className="text-white text-sm font-semibold">{n.title}</div>
                    <div className="text-xs text-gray-400">{n.source} • {n.published_at ? new Date(n.published_at).toLocaleString() : ''}</div>
                  </a>
                ))}
                {(!news || news.news?.length === 0) && (
                  <div className="text-gray-400 text-sm">No recent news available.</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {pairs?.pairs?.slice(0, 10).map((pair) => {
                const isPositive = parseFloat(pair.price_change_percent) >= 0;
                return (
                  <div
                    key={pair.id}
                    className="bg-[#1a2332] border border-gray-700 rounded-lg p-4 hover:border-blue-500/50 transition-all cursor-pointer"
                  >
                    <div className="text-white font-semibold mb-1">
                      {pair.symbol}
                    </div>
                    <div className="text-2xl font-bold text-white mb-2">
                      {parseFloat(pair.current_price).toFixed(5)}
                    </div>
                    <div
                      className={`flex items-center gap-1 text-sm ${
                        isPositive ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      <span>{Math.abs(parseFloat(pair.price_change_percent))}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
