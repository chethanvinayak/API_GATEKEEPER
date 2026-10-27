import React from 'react';
import {
  ShieldCheck,
  Zap,
  TrendingUp,
  Server,
  Scale,
  Volume2,
  HelpCircle
} from 'lucide-react';

interface StrategicMatrixProps {
  onVoiceExplain: (text: string) => void;
}

const MATRIX_DIMENSIONS = [
  {
    title: 'Fault Tolerance & Failover',
    score: '96/100',
    delta: '+12%',
    status: 'Optimal',
    icon: ShieldCheck,
    description: 'Active-active multi-region mesh with automated quorum election and stateless worker failover in under 200 milliseconds.',
    voiceScript: 'Fault tolerance is operating at an optimal 96 out of 100 score. Stateless worker nodes fail over in under 200 milliseconds across availability zones.'
  },
  {
    title: 'Throughput & P99 Latency',
    score: '92/100',
    delta: '+8%',
    status: 'High',
    icon: Zap,
    description: 'Kernel-bypass network streaming maintains sub-15 millisecond response times at 30,000 requests per second.',
    voiceScript: 'Throughput is robust at 92 out of 100. P99 latency remains locked below 15 milliseconds even during traffic peaks.'
  },
  {
    title: 'Resource Cost Efficiency',
    score: '84/100',
    delta: '+14%',
    status: 'Moderate',
    icon: TrendingUp,
    description: 'Dynamic scale-to-zero container nodes reduce idle resource expenditures by 38% during non-peak business hours.',
    voiceScript: 'Cost efficiency is rated at 84 percent. Automated scale-to-zero routines reduce non-peak infrastructure expenses by nearly 40 percent.'
  },
  {
    title: 'Data Consistency Invariants',
    score: '98/100',
    delta: '+3%',
    status: 'Exceptional',
    icon: Server,
    description: 'Raft consensus guarantees linearizable state mutations across distributed storage volumes with zero split-brain conditions.',
    voiceScript: 'Data consistency achieves 98 percent. Distributed Raft consensus ensures strict linearizability across all storage nodes.'
  }
];

export const StrategicMatrix: React.FC<StrategicMatrixProps> = ({ onVoiceExplain }) => {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">System Architecture & Strategic Matrix</h2>
            <p className="text-xs text-slate-400">
              Evaluated across core engineering vectors with live audio explainers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onVoiceExplain('Here is the strategic matrix summary: All four operational pillars show high resilience, with Data Consistency and Fault Tolerance leading our benchmark scores.')}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Explain Matrix with Voice</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MATRIX_DIMENSIONS.map((dim, idx) => {
            const IconComponent = dim.icon;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-5 hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{dim.title}</h3>
                      <span className="text-xs text-emerald-400 font-medium">
                        {dim.status} · {dim.delta} MoM
                      </span>
                    </div>
                  </div>

                  <span className="text-lg font-bold font-mono tabular-nums text-white">
                    {dim.score}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-300 leading-relaxed font-normal">
                  {dim.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onVoiceExplain(dim.voiceScript)}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Listen to breakdown</span>
                  </button>

                  <span className="text-[11px] text-slate-500 font-mono">
                    Vector 0{idx + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
