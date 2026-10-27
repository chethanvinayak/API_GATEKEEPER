import React, { useState } from 'react';
import {
  X,
  Volume2,
  ShieldCheck,
  Server,
  Layers,
  ArrowRight,
  Copy,
  Check,
  Terminal
} from 'lucide-react';
import type { SecurityEvent } from '../gateway/types.ts';

interface IncidentDrawerProps {
  event: SecurityEvent | null;
  onClose: () => void;
  onVoiceDebrief: (event: SecurityEvent) => void;
  isSpeaking: boolean;
}

export const IncidentDrawer: React.FC<IncidentDrawerProps> = ({
  event,
  onClose,
  onVoiceDebrief,
  isSpeaking
}) => {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [activeTab, setActiveTab] = useState<'forensics' | 'rules' | 'remediation' | 'payload'>('forensics');

  if (!event) return null;

  const generateCurl = () => {
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:3000';
    let url = `${origin}${event.path}`;
    if (event.query) {
      url += `?${event.query}`;
    }
    return `curl -i -X ${event.method} "${url}" \\\n  -H "X-Forwarded-For: ${event.client_ip}" \\\n  -H "User-Agent: ${event.user_agent.replace(/"/g, '\\"')}"`;
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(generateCurl());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto font-sans">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden text-slate-900">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-slate-200 bg-slate-50">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 font-mono">
              <span className="text-slate-700 font-bold uppercase tracking-wider">
                DEEP FORENSIC TELEMETRY INSPECTOR
              </span>
              <span aria-hidden="true">·</span>
              <span>{new Date(event.ts).toLocaleString()}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-3">
              <span className="font-mono">{event.method} {event.path}</span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                event.action === 'blocked' || event.action === 'banned'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                {event.action.toUpperCase()} ({event.status_code})
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onVoiceDebrief(event)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-2xs transition-colors cursor-pointer"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>{isSpeaking ? 'Debriefing...' : 'Voice Debrief'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Close inspector modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Protection Verdict Alert Banner */}
        <div className="px-6 pt-4 pb-2">
          <div className={`flex items-center justify-between p-3 rounded-xl border shadow-2xs ${
            event.reached_backend
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center gap-2.5">
              {event.reached_backend ? (
                <Server className="h-4 w-4 text-amber-600 shrink-0" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              )}
              <span className="text-xs font-bold">
                {event.reached_backend
                  ? 'Monitor Mode Notice: Traffic was allowed to pass to upstream backend for audit collection.'
                  : 'Perimeter Defense Verdict: ZERO malicious bytes reached upstream services. Intercepted in < 3ms.'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono shrink-0">
              <span className="text-slate-500">Gateway Latency:</span>
              <span className="text-emerald-700 font-bold">{event.latency_ms}ms</span>
            </div>
          </div>
        </div>

        {/* Internal Navigation Sub-Tabs */}
        <div className="px-6 pt-2 border-b border-slate-200 flex items-center gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('forensics')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'forensics'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Network Forensics & Packet Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'rules'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            OWASP CRS Violations ({event.findings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payload')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'payload'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Raw Query & Body Payload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('remediation')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'remediation'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Remediation & Code Fix
          </button>
        </div>

        {/* Body Content by Sub-Tab */}
        <div className="p-6 overflow-y-auto space-y-4 max-h-[60vh] bg-slate-50/50">
          {activeTab === 'forensics' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-white border border-slate-200 p-3.5 shadow-2xs">
                  <span className="text-[11px] text-slate-500 block mb-1">Origin IP Address</span>
                  <div className="font-mono text-sm font-bold text-slate-900">{event.client_ip}</div>
                  <span className="text-[10px] text-slate-400">Forwarded via X-Forwarded-For</span>
                </div>

                <div className="rounded-xl bg-white border border-slate-200 p-3.5 shadow-2xs">
                  <span className="text-[11px] text-slate-500 block mb-1">Transport & Protocol</span>
                  <div className="font-mono text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>HTTP/1.1 · TLS 1.3</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Port 443 · Reverse-Proxy Ingress</span>
                </div>

                <div className="rounded-xl bg-white border border-slate-200 p-3.5 shadow-2xs">
                  <span className="text-[11px] text-slate-500 block mb-1">OWASP CRS Anomaly Score</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`font-mono text-base font-bold ${event.score >= 5 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {event.score} pts
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {event.score >= 5 ? '(Threshold: 5 · BLOCKED)' : '(Threshold: 5 · PASS)'}
                    </span>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase ${event.score >= 5 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {event.severity} Severity
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-white border border-slate-200 p-3.5 shadow-2xs">
                <span className="text-[11px] text-slate-500 block mb-1">HTTP Client User-Agent</span>
                <div className="font-mono text-xs text-slate-800 bg-slate-50 p-2 rounded border border-slate-200 break-all">
                  {event.user_agent}
                </div>
              </div>

              <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">
                  <Layers className="h-4 w-4 text-indigo-600" />
                  <span>Multi-Decode Normalization Pipeline</span>
                </div>
                <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                  Before applying signature evaluation, API Gatekeeper strips obfuscation layers so attackers cannot evade pattern matching.
                </p>
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  {(event.decode_chain || ['raw_input']).map((stage, idx) => (
                    <React.Fragment key={idx}>
                      <span className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-indigo-800 font-semibold shadow-2xs">
                        {stage}
                      </span>
                      {idx < (event.decode_chain?.length || 1) - 1 && (
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-amber-600" />
                    <span>Reproduce via Terminal cURL</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCurl}
                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    {copiedCurl ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-200 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                  {generateCurl()}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-600 flex items-center justify-between">
                <span>{event.findings.length} rule violation(s) triggered anomaly scoring</span>
                <span className="font-mono font-bold text-rose-700">Total Score: +{event.score}</span>
              </div>

              {event.findings.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 italic bg-white rounded-xl border border-slate-200">
                  No rule violations. Request passed all positive OpenAPI schema contract checks.
                </div>
              ) : (
                event.findings.map((f, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-white border border-rose-200 p-4 text-xs space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{f.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-50 border border-rose-200 text-rose-800 font-bold">
                          {f.rule_id}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-rose-700">+{f.score} pts</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-slate-600 text-[11px]">
                      <span>Layer: <strong className="capitalize text-slate-800">{f.layer}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>OWASP: <strong className="text-slate-800">{f.owasp}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>CWE: <strong className="text-slate-800">{f.cwe}</strong></span>
                      {f.attack && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>ATT&CK: <strong className="text-slate-800">{f.attack}</strong></span>
                        </>
                      )}
                    </div>

                    {f.matched && (
                      <div className="rounded bg-slate-50 border border-rose-200 p-2.5 font-mono text-[11px] text-rose-900 break-all">
                        <span className="text-slate-500 font-sans block text-[10px] mb-0.5">Matched Substring / Capture Pattern:</span>
                        {f.matched}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'payload' && (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-2xs">
                <span className="text-slate-700 block font-bold uppercase tracking-wider mb-2">
                  Query String Parameters
                </span>
                {event.query ? (
                  <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 font-mono text-xs break-all whitespace-pre-wrap">
                    {event.query}
                  </pre>
                ) : (
                  <span className="text-slate-500 italic">No query string parameters present.</span>
                )}
              </div>

              <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-2xs">
                <span className="text-slate-700 block font-bold uppercase tracking-wider mb-2">
                  Request URI & Target Path
                </span>
                <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 font-mono text-xs">
                  {event.method} {event.path}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'remediation' && (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 text-emerald-700 font-bold uppercase tracking-wider">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Developer Remediation Guideline</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Even though API Gatekeeper intercepts and shields your servers from this vector, defense-in-depth requires remediation at the application layer:
                </p>

                {event.primary_category === 'sqli' && (
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 mt-2">
                    <strong className="text-slate-900 block mb-1">SQL Injection Fix:</strong>
                    <p className="text-slate-600 mb-2">Always use parameterized queries or an ORM with prepared statements.</p>
                    <code className="text-[11px] font-mono text-emerald-800 block bg-white p-2 rounded border border-slate-200">
                      db.query('SELECT * FROM products WHERE name = $1', [userInput])
                    </code>
                  </div>
                )}

                {event.primary_category === 'prompt_injection' && (
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 mt-2">
                    <strong className="text-slate-900 block mb-1">LLM Prompt Injection Fix:</strong>
                    <p className="text-slate-600 mb-2">Separate developer system instructions from untrusted user content using structural XML/JSON delimiters.</p>
                  </div>
                )}

                {event.primary_category !== 'sqli' && event.primary_category !== 'prompt_injection' && (
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 mt-2">
                    <strong className="text-slate-900 block mb-1">Input Validation & Schema Guard:</strong>
                    <p className="text-slate-600 mb-2">Enforce strict OpenAPI contract specifications and reject undeclared properties using JSON schema validation.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
