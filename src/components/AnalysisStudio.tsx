import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Cpu,
  Layers,
  TrendingUp,
  Image as ImageIcon,
  Upload,
  X,
  ArrowRight
} from 'lucide-react';
import type { AnalysisMode, SampleTemplate } from '../types.ts';

interface AnalysisStudioProps {
  onRunAnalysis: (prompt: string, mode: AnalysisMode, imageBase64?: string) => Promise<void>;
  isLoading: boolean;
}

const TEMPLATES: SampleTemplate[] = [
  {
    id: 'arch-1',
    title: 'Cloud Architecture & Scalability Audit',
    mode: 'architecture',
    tag: 'Cloud & Infrastructure',
    description: 'Audit high-throughput distributed microservices, auto-scaling thresholds, and zero-trust perimeter.',
    prompt: 'Evaluate our multi-region Kubernetes cluster architecture handling 25,000 requests per second. Review cache synchronization, database write-contention under peak load, failover latency, and disaster recovery invariants.'
  },
  {
    id: 'strat-1',
    title: 'Biotech AI Drug Discovery Pipeline',
    mode: 'strategic',
    tag: 'Life Sciences & Biotech',
    description: 'Strategic roadmap for AI molecular generation, affinity screening, and preclinical validation.',
    prompt: 'Synthesize the strategic roadmap for deploying foundation models in small-molecule drug discovery. Include target identification, ligand-protein docking verification, assay feedback loops, and regulatory FDA milestone checks.'
  },
  {
    id: 'market-1',
    title: 'Enterprise AI Agent Orchestration Matrix',
    mode: 'market',
    tag: 'Enterprise Strategy',
    description: 'Feasibility analysis for multi-agent autonomous workflows with human-in-the-loop safeguards.',
    prompt: 'Analyze enterprise adoption feasibility of multi-agent autonomous reasoning networks. Address security sandboxing, auditability, tool-calling rate limits, state persistence, and cost-benefit ratios across enterprise departments.'
  },
  {
    id: 'vision-1',
    title: 'Industrial Schematic & Circuit Inspection',
    mode: 'vision',
    tag: 'Multimodal Vision',
    description: 'Inspect architectural diagrams, system blueprints, or data flow topologies for bottlenecks.',
    prompt: 'Examine this industrial engineering topology. Detect failure single-points, calculate redundancy factor, verify signal integrity pathways, and recommend defensive fail-safes.'
  }
];

export const AnalysisStudio: React.FC<AnalysisStudioProps> = ({
  onRunAnalysis,
  isLoading
}) => {
  const [prompt, setPrompt] = useState<string>(TEMPLATES[0].prompt);
  const [selectedMode, setSelectedMode] = useState<AnalysisMode>('architecture');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectTemplate = (template: SampleTemplate) => {
    setPrompt(template.prompt);
    setSelectedMode(template.mode);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result as string);
      setSelectedMode('vision');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && !imageBase64) return;
    onRunAnalysis(prompt, selectedMode, imageBase64 || undefined);
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector Tabs (Functional segmented controls) */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/90 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => setSelectedMode('architecture')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            selectedMode === 'architecture'
              ? 'bg-indigo-600 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="h-3.5 w-3.5" />
          <span>System Architecture</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedMode('strategic')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            selectedMode === 'strategic'
              ? 'bg-indigo-600 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Strategic Intelligence</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedMode('vision')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            selectedMode === 'vision'
              ? 'bg-indigo-600 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          <span>Visual & Diagram Vision</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedMode('market')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            selectedMode === 'market'
              ? 'bg-indigo-600 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Feasibility & Risk</span>
        </button>
      </div>

      {/* Main Analysis Prompt Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <label htmlFor="analysis-prompt" className="text-sm font-semibold text-white">
            Analysis Brief & Technical Constraints
          </label>
          <span className="text-xs text-slate-400">
            Powered by Gemini 3.8 Flash
          </span>
        </div>

        <div className="relative">
          <textarea
            id="analysis-prompt"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your technical architecture, business strategy, or operational dilemma for deep intelligence..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950/80 p-3.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed font-normal"
          />
        </div>

        {/* Image / Diagram Attachment Bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5 text-indigo-400" />
              <span>Attach Diagram / Image</span>
            </button>

            {imageBase64 && (
              <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-200">
                <span className="truncate max-w-[120px]">Image attached</span>
                <button
                  type="button"
                  onClick={() => setImageBase64(null)}
                  className="text-slate-400 hover:text-rose-400"
                  aria-label="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || (!prompt.trim() && !imageBase64)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Synthesizing Intelligence...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Run Analysis</span>
              </>
            )}
          </button>
        </div>

        {/* Thumbnail Preview if Image Attached */}
        {imageBase64 && (
          <div className="mt-3 relative w-32 h-20 rounded-lg overflow-hidden border border-slate-700">
            <img
              src={imageBase64}
              alt="Uploaded schematic"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </form>

      {/* Preset Strategy Blueprints & Demos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Curated Intelligence Blueprints
          </h3>
          <span className="text-xs text-slate-500">1-Click Load</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => handleSelectTemplate(tmpl)}
              className="flex flex-col text-left rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 hover:border-indigo-500/50 hover:bg-slate-900/90 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-medium text-indigo-400">{tmpl.tag}</span>
                <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-slate-400 group-hover:text-indigo-300">
                  <span>Load</span>
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white group-hover:text-indigo-200 transition-colors">
                {tmpl.title}
              </h4>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                {tmpl.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
