import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  Volume2,
  RefreshCw,
  Sliders,
  Layers,
  Cpu
} from 'lucide-react';

interface VisualStudioProps {
  onAnalyzeVisual: (prompt: string, imageBase64?: string) => Promise<void>;
  onVoiceTrigger: (script: string) => void;
  isLoading: boolean;
}

export const VisualStudio: React.FC<VisualStudioProps> = ({
  onAnalyzeVisual,
  onVoiceTrigger,
  isLoading
}) => {
  const [imagePrompt, setImagePrompt] = useState<string>('Clean architectural isometric schematic of multi-cloud data pipeline with high-throughput stream nodes');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePrompt.trim()) return;

    setIsGenerating(true);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          aspectRatio,
        }),
      });

      const data = await response.json();
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setStatusMessage('Image successfully generated.');
      } else {
        // High fidelity schematic graphic fallback container
        setStatusMessage(data.error || 'Using vector conceptual schematic view.');
      }
    } catch {
      setStatusMessage('Displaying interactive technical schematic.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-5 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Visual Intelligence & Architectural Studio</h2>
            <p className="text-xs text-slate-400">
              Generate concept schematics, audit visual workflows, and have the Voice Agent explain diagrams.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onVoiceTrigger('In this visual schematic, the distributed message brokers buffer incoming telemetry bursts, ensuring zero packet loss during peak cluster workloads.')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Volume2 className="h-3.5 w-3.5 text-indigo-400" />
              <span>Voice Explain Diagram</span>
            </button>
          </div>
        </div>

        {/* Generator Form */}
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label htmlFor="visual-prompt" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Visual Asset & Diagram Prompt
            </label>
            <input
              id="visual-prompt"
              type="text"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="e.g. Isometric technical diagram of Kubernetes cluster with failover replication"
              className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Aspect Ratio:</span>
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
                {['16:9', '4:3', '1:1'].map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                      aspectRatio === ratio
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating || !imagePrompt.trim()}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Synthesizing Visual...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generate Diagram</span>
                </>
              )}
            </button>
          </div>
        </form>

        {statusMessage && (
          <p className="mt-3 text-xs text-indigo-400 font-medium">
            {statusMessage}
          </p>
        )}

        {/* Visual Showcase Box */}
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/80 p-5 overflow-hidden">
          {generatedImage ? (
            <div className="relative rounded-lg overflow-hidden border border-slate-800">
              <img
                src={generatedImage}
                alt="AI Generated Diagram"
                referrerPolicy="no-referrer"
                className="w-full object-cover rounded-lg"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <a
                  href={generatedImage}
                  download="omnimind-schematic.png"
                  className="flex items-center gap-1 rounded bg-slate-900/90 border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          ) : (
            /* Styled CSS/SVG Fallback Container per Frontend Design Constitution Section 3.E */
            <div className="relative flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-lg border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
              <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shadow-inner">
                <Cpu className="h-10 w-10 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
                  AI
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white">
                Interactive Neural Architecture Schematic
              </h3>
              <p className="mt-1 text-xs text-slate-400 max-w-md leading-relaxed">
                Visual pipeline topology maps cluster ingress, event queuing, and automated load balancing across redundant availability zones.
              </p>

              {/* Graphical Node Wireframe */}
              <div className="mt-6 w-full max-w-lg grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 text-left">
                  <span className="text-[10px] uppercase font-mono text-indigo-400">Layer 01</span>
                  <p className="text-xs font-semibold text-white mt-0.5">Ingress Gateway</p>
                  <span className="text-[11px] text-emerald-400 font-mono">1.2ms latency</span>
                </div>
                <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 text-left">
                  <span className="text-[10px] uppercase font-mono text-indigo-400">Layer 02</span>
                  <p className="text-xs font-semibold text-white mt-0.5">Stream Router</p>
                  <span className="text-[11px] text-emerald-400 font-mono">18.4k req/s</span>
                </div>
                <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 text-left">
                  <span className="text-[10px] uppercase font-mono text-indigo-400">Layer 03</span>
                  <p className="text-xs font-semibold text-white mt-0.5">Storage Replica</p>
                  <span className="text-[11px] text-emerald-400 font-mono">99.99% sync</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => onAnalyzeVisual('Audit this 3-tier distributed cluster topology for failover resiliency and write-contention under sudden 10x traffic spikes.')}
                  disabled={isLoading}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Audit Schematic with Gemini</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
