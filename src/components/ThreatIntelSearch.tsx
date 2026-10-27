import React, { useState } from 'react';
import { Search, Globe, ShieldAlert, CheckCircle2, ExternalLink, Sparkles, Loader2 } from 'lucide-react';

export const ThreatIntelSearch: React.FC = () => {
  const [query, setQuery] = useState('Latest 2026 zero-day CVE advisories and OWASP API Top 10 mitigation strategies');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ answer: string; sources: Array<{ title: string; url: string }> } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error('Search grounding error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Google Search Grounded Threat Intel</h2>
            <p className="text-xs text-slate-500">Live zero-day CVE advisories & OWASP vulnerability intelligence via Gemini 3.8 Flash</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          GROUNDING ACTIVE
        </span>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vulnerabilities, CVEs, or security vectors..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-blue-600 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Searching...</span>
            </>
          ) : (
            <>
              <span>Ground Intel</span>
            </>
          )}
        </button>
      </form>

      {result && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4 animate-fadeIn">
          <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
            {result.answer}
          </div>

          {result.sources && result.sources.length > 0 && (
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Verified Grounded Sources
              </span>
              <div className="flex flex-wrap gap-2">
                {result.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-blue-600 hover:border-blue-300 transition-colors shadow-2xs"
                  >
                    <span className="truncate max-w-[200px]">{src.title || src.url}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
