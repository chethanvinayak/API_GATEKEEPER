import React, { useState } from 'react';
import {
  Play,
  Layers,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Volume2,
  Code2,
  ArrowRight
} from 'lucide-react';

interface PayloadTesterViewProps {
  onVoiceDebrief: (text: string) => void;
}

const PRESETS = [
  {
    name: "SQLi: Boolean-Blind Auth Bypass",
    method: 'GET',
    path: '/api/products',
    query: "search=phone' OR 1=1--",
    body: ''
  },
  {
    name: 'NoSQL: Operator $ne Injection',
    method: 'POST',
    path: '/api/login',
    query: '',
    body: '{\n  "username": { "$ne": null },\n  "password": { "$gt": "" }\n}'
  },
  {
    name: 'Evasion: Double URL Encoded SQLi',
    method: 'GET',
    path: '/api/products',
    query: 'search=%2527%2520UNION/**/SELECT%25201,2--',
    body: ''
  },
  {
    name: 'Mass Assignment: Injected Role',
    method: 'POST',
    path: '/api/register',
    query: '',
    body: '{\n  "username": "hacker",\n  "email": "hacker@test.com",\n  "role": "admin",\n  "balance": 99999\n}'
  },
  {
    name: "Hard Benign: Name with Apostrophe",
    method: 'GET',
    path: '/api/products',
    query: "search=O'Brien and Sons Supplies",
    body: ''
  }
];

export const PayloadTesterView: React.FC<PayloadTesterViewProps> = ({ onVoiceDebrief }) => {
  const [method, setMethod] = useState<string>('GET');
  const [path, setPath] = useState<string>('/api/products');
  const [query, setQuery] = useState<string>("search=phone' OR 1=1--");
  const [body, setBody] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);

  const handleApplyPreset = (p: typeof PRESETS[0]) => {
    setMethod(p.method);
    setPath(p.path);
    setQuery(p.query);
    setBody(p.body);
  };

  const handleInspect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let parsedBody = null;
    if (body.trim()) {
      try {
        parsedBody = JSON.parse(body);
      } catch {
        parsedBody = body;
      }
    }

    try {
      const response = await fetch('/_gk/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          path,
          query,
          body: parsedBody
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Dry-run test error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Interactive Payload Tester (Dry-Run Sandbox)</h2>
            <p className="text-xs text-slate-400">
              Submit crafted requests to evaluate normalizer decode chains, signature rules, and contract validation without touching any backend.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {result && (
              <button
                type="button"
                onClick={() => onVoiceDebrief(`Dry-run inspection result: Action is ${result.decision.action.toUpperCase()} with an anomaly score of ${result.decision.totalScore}. Matched ${result.findings.length} security rules.`)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <Volume2 className="h-3.5 w-3.5 text-red-400" />
                <span>Voice Explain Result</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="mb-6">
          <span className="text-xs text-slate-400 block mb-2 font-medium">Quick Presets:</span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Request Configurator Column */}
          <form onSubmit={handleInspect} className="lg:col-span-6 space-y-4">
            <div className="flex items-center gap-2">
              <select
                aria-label="HTTP Method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono font-bold text-indigo-400 outline-none cursor-pointer"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>

              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/api/products"
                className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Query String:
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="search=phone"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Request Body (JSON / Text):
              </label>
              <textarea
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{ "key": "value" }'
                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs font-mono text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-red-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Inspecting Payload...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-white" />
                  <span>Inspect Payload (Dry Run)</span>
                </>
              )}
            </button>
          </form>

          {/* Inspection Results Column */}
          <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-950 p-5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Inspection Decision & Analysis
            </h3>

            {!result ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Configure request parameters and click "Inspect Payload" to view decision breakdown.
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Decision Header */}
                <div className={`p-3 rounded-lg border flex items-center justify-between ${
                  result.decision.action === 'blocked'
                    ? 'bg-red-950/30 border-red-800/60 text-red-300'
                    : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                }`}>
                  <div className="flex items-center gap-2">
                    {result.decision.action === 'blocked' ? (
                      <ShieldAlert className="h-4 w-4 text-red-400" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    )}
                    <span className="font-mono font-bold text-sm">
                      {result.decision.action.toUpperCase()} ({result.decision.action === 'blocked' ? '403 Forbidden' : '200 OK'})
                    </span>
                  </div>
                  <span className="font-mono font-bold">
                    Score: {result.decision.totalScore} / 5
                  </span>
                </div>

                {/* Normaliser Decode Chain */}
                <div className="rounded-lg bg-slate-900 border border-slate-800/80 p-3">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    <span>Decode Chain</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 font-mono text-[11px]">
                    {(result.decodeChain || ['raw']).map((step: string, idx: number) => (
                      <React.Fragment key={idx}>
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                          {step}
                        </span>
                        {idx < result.decodeChain.length - 1 && (
                          <ArrowRight className="h-3 w-3 text-slate-500" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Matched Findings */}
                <div>
                  <span className="font-medium text-slate-400 block mb-1.5">
                    Matched Rules ({result.findings.length}):
                  </span>
                  {result.findings.length === 0 ? (
                    <p className="text-emerald-400 font-mono text-[11px]">
                      Zero rule violations. Request safely classified as legitimate.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {result.findings.map((f: any, idx: number) => (
                        <div key={idx} className="rounded bg-slate-900 border border-slate-800 p-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-white">{f.name}</span>
                            <span className="font-mono text-red-400 font-bold">+{f.score}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono block">
                            Rule: {f.rule_id} · OWASP: {f.owasp} · CWE: {f.cwe}
                          </span>
                          {f.matched && (
                            <span className="text-[11px] text-red-300 font-mono block mt-1 break-all">
                              Matched: {f.matched}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
