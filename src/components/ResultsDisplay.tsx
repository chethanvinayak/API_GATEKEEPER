import React, { useState } from 'react';
import {
  Volume2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  Download,
  Share2,
  TrendingUp,
  TrendingDown,
  Layers
} from 'lucide-react';
import type { AnalysisResult } from '../types.ts';

interface ResultsDisplayProps {
  result: AnalysisResult;
  onVoiceTrigger: (topic: string) => void;
  isSpeaking: boolean;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  result,
  onVoiceTrigger,
  isSpeaking
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'findings' | 'roadmap' | 'risks' | 'json'>('overview');
  const [copied, setCopied] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const handleCopy = () => {
    const textToCopy = `# ${result.title}
Date: ${result.timestamp}
Confidence: ${result.confidenceScore}%

## Executive Summary
${result.summary}

## Key Findings
${result.keyFindings.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## Action Roadmap
${result.actionItems.map((a, i) => `- [ ] ${a}`).join('\n')}

## Risk Analysis
${result.risks.map((r, i) => `- ${r}`).join('\n')}
`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = `# ${result.title}\n\n${result.summary}\n\n## Action Items\n${result.actionItems.map(a => `- ${a}`).join('\n')}`;
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleStep = (idx: number) => {
    setCompletedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-6">
      {/* Title & Metadata Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span>{result.timestamp}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-emerald-400">
                {result.confidenceScore}% Verification Confidence
              </span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{result.mode} Intelligence</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white text-balance">
              {result.title}
            </h1>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onVoiceTrigger(result.summary)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer ${
                isSpeaking
                  ? 'bg-rose-600 hover:bg-rose-500'
                  : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              <Volume2 className="h-4 w-4" />
              <span>{isSpeaking ? 'Speaking Now' : 'Voice Explain'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              aria-label="Copy markdown"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              aria-label="Download markdown report"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Report</span>
            </button>
          </div>
        </div>

        {/* 4-Column Key Metrics Strip with Tabular Numerals */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 pt-6 border-t border-slate-800">
          {result.metrics.map((metric, idx) => (
            <div
              key={idx}
              className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3.5"
            >
              <span className="text-xs text-slate-400 block truncate">
                {metric.label}
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono tabular-nums text-white">
                  {metric.value}
                </span>
                {metric.change && (
                  <span
                    className={`flex items-center text-xs font-mono font-medium ${
                      metric.trend === 'down' && metric.label.toLowerCase().includes('risk')
                        ? 'text-emerald-400'
                        : metric.trend === 'up'
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {metric.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-0.5" />
                    )}
                    {metric.change}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Structured Tabs Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Executive Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('findings')}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'findings'
              ? 'bg-indigo-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Key Discoveries ({result.keyFindings.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('roadmap')}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'roadmap'
              ? 'bg-indigo-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Action Roadmap ({result.actionItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('risks')}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'risks'
              ? 'bg-indigo-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Risk Assessment ({result.risks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('json')}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'json'
              ? 'bg-indigo-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Data Payload (JSON)
        </button>
      </div>

      {/* Tab Contents */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg backdrop-blur-sm">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-white mb-2">
                Executive Synthesis
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                {result.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-2">
                  <Layers className="h-4 w-4" />
                  <span>Strategic Highlights</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {result.keyFindings.slice(0, 3).map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-indigo-400 font-mono">0{idx + 1}.</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Immediate Action Step</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {result.actionItems[0] || 'Execute primary architectural migration checklist.'}
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => onVoiceTrigger(`Here is your immediate action priority: ${result.actionItems[0]}`)}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Have Voice Agent explain this step</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'findings' && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-white mb-3">
              Synthesized Discoveries & Operational Insights
            </h2>
            <div className="space-y-3">
              {result.keyFindings.map((finding, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-lg bg-slate-950/60 border border-slate-800/80 p-3.5"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-500/20 text-indigo-400 text-xs font-mono font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {finding}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">
                Prioritized Action Roadmap
              </h2>
              <span className="text-xs text-slate-400">
                {Object.values(completedSteps).filter(Boolean).length} of {result.actionItems.length} completed
              </span>
            </div>

            <div className="space-y-2.5">
              {result.actionItems.map((action, idx) => {
                const isDone = !!completedSteps[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    className={`flex items-start gap-3 rounded-lg border p-3.5 transition-all cursor-pointer ${
                      isDone
                        ? 'bg-slate-950/40 border-slate-800/60 text-slate-400'
                        : 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => {}}
                      className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className={`text-xs sm:text-sm leading-relaxed ${isDone ? 'line-through text-slate-500' : ''}`}>
                        {action}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'risks' && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-white mb-3">
              Critical Failure Points & Risk Analysis
            </h2>
            <div className="space-y-3">
              {result.risks.map((risk, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-lg bg-rose-950/20 border border-rose-900/40 p-4"
                >
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-xs font-semibold text-rose-300">
                      Vulnerability Factor 0{idx + 1}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {risk}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'json' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono">JSON Schema Verified Payload</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="text-indigo-400 hover:text-indigo-300"
              >
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
            </div>
            <pre className="max-h-96 overflow-auto rounded-lg bg-slate-950 p-4 text-xs font-mono text-indigo-300 border border-slate-800">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
