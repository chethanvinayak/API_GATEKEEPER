import React from 'react';
import { Volume2, CheckCircle2, Zap } from 'lucide-react';

interface BenchmarksProps {
  onVoiceExplain: (text: string) => void;
}

const BENCHMARK_DATA = [
  {
    model: 'Gemini 3.8 Flash',
    capability: 'Reasoning & Strategic Analysis',
    latency: '340ms',
    throughput: '142 tps',
    accuracy: '94.8%',
    tier: 'Optimal for real-time analysis'
  },
  {
    model: 'Gemini 3.8 Flash-Lite TTS',
    capability: 'Spoken Audio Synthesis (WAV 24kHz)',
    latency: '180ms',
    throughput: '320 tps',
    accuracy: '98.2%',
    tier: 'Ultra-low latency conversational voice'
  },
  {
    model: 'Gemini 3.1 Flash-Lite Image',
    capability: 'Schematic & Diagram Generation',
    latency: '1.4s',
    throughput: 'Single Frame',
    accuracy: '91.5%',
    tier: 'Visual architecture drafting'
  }
];

export const Benchmarks: React.FC<BenchmarksProps> = ({ onVoiceExplain }) => {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Model Benchmarks & Latency Telemetry</h2>
            <p className="text-xs text-slate-400">
              Evaluated runtime latency, synthesis throughput, and audio fidelity metrics.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onVoiceExplain('The runtime telemetry shows Gemini 3.8 Flash delivers sub-350 millisecond reasoning latency, while Flash-Lite TTS produces studio-grade 24 kilohertz audio in just 180 milliseconds.')}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Voice Explain Benchmarks</span>
          </button>
        </div>

        {/* Benchmarks Table with Tabular Numerals */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Engine / Model</th>
                <th className="py-3 px-4 font-semibold">Specialized Modality</th>
                <th className="py-3 px-4 font-semibold text-right">TTFB Latency</th>
                <th className="py-3 px-4 font-semibold text-right">Throughput</th>
                <th className="py-3 px-4 font-semibold text-right">Benchmark Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {BENCHMARK_DATA.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {row.model}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {row.capability}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-emerald-400">
                    {row.latency}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-200">
                    {row.throughput}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-indigo-400 font-semibold">
                    {row.accuracy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
