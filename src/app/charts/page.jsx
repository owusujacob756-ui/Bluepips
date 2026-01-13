"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowDownRight, TrendingUp, BarChart3 } from "lucide-react";

// API fetch functions
const fetchPairs = async () => {
  const response = await fetch('/api/forex/pairs');
  if (!response.ok) throw new Error('Failed to fetch pairs');
  return response.json();
};

const fetchPriceHistory = async (pairId, timeframe) => {
  const response = await fetch(`/api/price-history?pairId=${pairId}&timeframe=${timeframe}&limit=100`);
  if (!response.ok) throw new Error('Failed to fetch price history');
  return response.json();
};

export default function ChartsPage() {
  const [selectedPair, setSelectedPair] = useState('1');
  const [timeframe, setTimeframe] = useState('1H');

  const { data: pairs } = useQuery({
    queryKey: ['forexPairs'],
    queryFn: fetchPairs,
  });

  const { data: priceHistory } = useQuery({
    queryKey: ['priceHistory', selectedPair, timeframe],
    queryFn: () => fetchPriceHistory(selectedPair, timeframe),
    enabled: !!selectedPair,
  });

  const currentPair = pairs?.pairs?.find(p => p.id === parseInt(selectedPair));

  // Simple chart component
  const SimpleChart = ({ data }) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-96 bg-[#1a2332] rounded-lg">
          <div className="text-gray-400">No data available</div>
        </div>
      );
    }

    const prices = data.map(d => parseFloat(d.close_price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    return (
      <div className="bg-[#1a2332] rounded-lg p-4">
        <div className="h-80 relative">
          <svg width="100%" height="100%" className="overflow-visible">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((percent) => (
              <line
                key={percent}
                x1="0"
                y1={`${percent}%`}
                x2="100%"
                y2={`${percent}%`}
                stroke="#374151"
                strokeWidth="1"
              />
            ))}
            
            {/* Price line */}
            <polyline
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              points={data.map((d, i) => {
                const x = (i / (data.length - 1)) * 100;
                const y = 100 - ((parseFloat(d.close_price) - minPrice) / priceRange) * 100;
                return `${x}%,${y}%`;
              }).join(' ')}
            />
            
            {/* Data points */}
            {data.map((d, i) => {
              const x = (i / (data.length - 1)) * 100;
              const y = 100 - ((parseFloat(d.close_price) - minPrice) / priceRange) * 100;
              return (
                <circle
                  key={i}
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r="3"
                  fill="#3B82F6"
                  className="hover:r-5 cursor-pointer"
                />
              );
            })}
          </svg>
        </div>
        
        <div className="flex justify-between mt-4 text-xs text-gray-400">
          <div>{data[0]?.timestamp ? new Date(data[0].timestamp).toLocaleDateString() : ''}</div>
          <div>{data[data.length - 1]?.timestamp ? new Date(data[data.length - 1].timestamp).toLocaleDateString() : ''}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B1120] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Market Charts</h1>
          <p className="text-gray-400">Real-time forex price analysis and technical indicators</p>
        </div>

        {/* Controls */}
        <div className="bg-[#151F2E] border border-gray-800 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pair selector */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Currency Pair
              </label>
              <select
                value={selectedPair}
                onChange={(e) => setSelectedPair(e.target.value)}
                className="w-full bg-[#1a2332] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              >
                {pairs?.pairs?.map((pair) => (
                  <option key={pair.id} value={pair.id}>
                    {pair.symbol} - {pair.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Timeframe selector */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Timeframe
              </label>
              <div className="flex gap-2">
                {["1H", "4H", "1D"].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                      timeframe === tf
                        ? "bg-blue-500 text-white"
                        : "bg-[#1a2332] text-gray-400 hover:bg-[#1f2937]"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Current Price */}
        {currentPair && (
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {currentPair.symbol}
                </h2>
                <p className="text-gray-400">{currentPair.name}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-white mb-2">
                  {parseFloat(currentPair.current_price).toFixed(5)}
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    parseFloat(currentPair.price_change_percent) >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {parseFloat(currentPair.price_change_percent) >= 0 ? (
                    <ArrowUpRight className="w-5 h-5" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5" />
                  )}
                  <span className="font-semibold">
                    {Math.abs(parseFloat(currentPair.price_change_percent))}%
                  </span>
                  <span className="text-sm">
                    ({Math.abs(parseFloat(currentPair.price_change_24h))})
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="bg-[#151F2E] border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Price Chart
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <TrendingUp className="w-4 h-4" />
              {timeframe} timeframe
            </div>
          </div>
          
          <SimpleChart data={priceHistory?.priceHistory} />
        </div>

        {/* Statistics */}
        {priceHistory?.priceHistory && priceHistory.priceHistory.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#151F2E] border border-gray-800 rounded-xl p-6">
              <div className="text-sm text-gray-400 mb-2">High</div>
              <div className="text-2xl font-bold text-white">
                {Math.max(...priceHistory.priceHistory.map(d => parseFloat(d.high_price))).toFixed(5)}
              </div>
            </div>
            <div className="bg-[#151F2E] border border-gray-800 rounded-xl p-6">
              <div className="text-sm text-gray-400 mb-2">Low</div>
              <div className="text-2xl font-bold text-white">
                {Math.min(...priceHistory.priceHistory.map(d => parseFloat(d.low_price))).toFixed(5)}
              </div>
            </div>
            <div className="bg-[#151F2E] border border-gray-800 rounded-xl p-6">
              <div className="text-sm text-gray-400 mb-2">Average Volume</div>
              <div className="text-2xl font-bold text-white">
                {Math.round(
                  priceHistory.priceHistory.reduce((sum, d) => sum + parseInt(d.volume), 0) / 
                  priceHistory.priceHistory.length
                ).toLocaleString()}
              </div>
            </div>
            <div className="bg-[#151F2E] border border-gray-800 rounded-xl p-6">
              <div className="text-sm text-gray-400 mb-2">Price Change</div>
              <div className={`text-2xl font-bold ${
                priceHistory.priceHistory.length > 1 && 
                parseFloat(priceHistory.priceHistory[priceHistory.priceHistory.length - 1].close_price) > 
                parseFloat(priceHistory.priceHistory[0].open_price)
                  ? "text-green-400"
                  : "text-red-400"
              }`}>
                {priceHistory.priceHistory.length > 1
                  ? (
                      parseFloat(priceHistory.priceHistory[priceHistory.priceHistory.length - 1].close_price) - 
                      parseFloat(priceHistory.priceHistory[0].open_price)
                    ).toFixed(5)
                  : "0.00000"
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
