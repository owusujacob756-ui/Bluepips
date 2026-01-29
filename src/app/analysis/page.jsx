"use client";

import { useEffect, useState } from 'react';

export default function AnalysisPage() {
  const [pairs, setPairs] = useState([]);
  const [selected, setSelected] = useState('EUR/USD');
  const [timeframe, setTimeframe] = useState('1H');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/forex/pairs')
      .then((r) => r.json())
      .then((data) => setPairs(data.pairs || []))
      .catch(() => setPairs([]));
  }, []);

  async function runAnalysis() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/analysis/combined', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pair: selected, timeframe }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Analysis failed');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">AI Analysis</h1>

      <div className="flex gap-2 mb-4">
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="bg-[#0B1120] border border-gray-700 p-2 rounded text-white">
          {pairs.map((p) => <option key={p.id} value={p.symbol}>{p.symbol}</option>)}
        </select>
        <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="bg-[#0B1120] border border-gray-700 p-2 rounded text-white">
          <option>1H</option>
          <option>4H</option>
          <option>1D</option>
        </select>
        <button onClick={runAnalysis} disabled={running} className="bg-blue-500 px-4 py-2 rounded text-white">{running ? 'Running...' : 'Run AI Analysis'}</button>
      </div>

      {error && <div className="text-red-400 mb-4">{error}</div>}

      {result && (
        <div className="bg-[#151F2E] border border-gray-800 rounded p-4">
          <div className="mb-2 font-semibold text-white">Overall: {result.overall || 'N/A'} ({result.confidence || 0}%)</div>
          <div className="text-sm text-gray-400 mb-2">Technical Summary:</div>
          <pre className="bg-[#0B1120] p-3 rounded text-xs text-gray-200">{JSON.stringify(result.tech, null, 2)}</pre>
          <div className="text-sm text-gray-400 mt-3 mb-2">Fundamental Summary:</div>
          <pre className="bg-[#0B1120] p-3 rounded text-xs text-gray-200">{JSON.stringify(result.fund, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
