import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  Clock,
  Eye,
  Volume2
} from 'lucide-react';
import type { SecurityEvent, ActionType } from '../gateway/types.ts';

interface LiveAttackFeedProps {
  events: SecurityEvent[];
  onSelectEvent: (event: SecurityEvent) => void;
  onVoiceDebrief: (event: SecurityEvent) => void;
}

export const LiveAttackFeed: React.FC<LiveAttackFeedProps> = ({
  events,
  onSelectEvent,
  onVoiceDebrief
}) => {
  const [actionFilter, setActionFilter] = useState<'all' | 'blocked' | 'rate_limited' | 'allowed'>('all');

  const filteredEvents = events.filter((e) => {
    if (actionFilter === 'all') return true;
    if (actionFilter === 'blocked') return e.action === 'blocked' || e.action === 'banned';
    if (actionFilter === 'rate_limited') return e.action === 'rate_limited';
    if (actionFilter === 'allowed') return e.action === 'allowed' || e.action === 'flagged';
    return true;
  });

  const getActionBadge = (action: ActionType) => {
    switch (action) {
      case 'blocked':
      case 'banned':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold font-mono text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
            <ShieldAlert className="h-3 w-3 text-rose-600" />
            <span>BLOCKED</span>
          </span>
        );
      case 'rate_limited':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold font-mono text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            <AlertOctagon className="h-3 w-3 text-amber-600" />
            <span>429 RATE LIMIT</span>
          </span>
        );
      case 'flagged':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold font-mono text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            <span>FLAGGED (MONITOR)</span>
          </span>
        );
      case 'allowed':
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-semibold font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            <span>ALLOWED</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Live Security Event Stream</h2>
          <span className="text-xs text-slate-500">
            {events.length} total events intercepted
          </span>
        </div>

        {/* Enterprise Flat Tab Navigation */}
        <div className="flex items-center gap-6 border-b border-slate-200 pb-px">
          <button
            type="button"
            onClick={() => setActionFilter('all')}
            className={`pb-2 text-xs font-mono font-bold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              actionFilter === 'all'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>All Probes</span>
            <span className="text-[10px] text-slate-400 font-mono tabular-nums">({events.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActionFilter('blocked')}
            className={`pb-2 text-xs font-mono font-bold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              actionFilter === 'blocked'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Blocked</span>
            <span className="text-[10px] text-slate-400 font-mono tabular-nums">
              ({events.filter(e => e.action === 'blocked' || e.action === 'banned').length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActionFilter('rate_limited')}
            className={`pb-2 text-xs font-mono font-bold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              actionFilter === 'rate_limited'
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>429 Throttled</span>
            <span className="text-[10px] text-slate-400 font-mono tabular-nums">
              ({events.filter(e => e.action === 'rate_limited').length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActionFilter('allowed')}
            className={`pb-2 text-xs font-mono font-bold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              actionFilter === 'allowed'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Allowed</span>
            <span className="text-[10px] text-slate-400 font-mono tabular-nums">
              ({events.filter(e => e.action === 'allowed' || e.action === 'flagged').length})
            </span>
          </button>
        </div>
      </div>

      {/* Events Table / Card Feed */}
      <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
        {filteredEvents.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
            <div className="text-sm font-semibold text-slate-800 mb-1">
              {events.length === 0 ? 'No Intercepted Traffic Recorded' : 'No Events Match Current Filter'}
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {events.length === 0
                ? 'The gateway is running cleanly with zero hardcoded baseline events. Trigger simulated adversary traffic or send a real payload from the Request Lab.'
                : 'Try switching the filter to "All Events" to view intercepted traffic.'}
            </p>
            {events.length === 0 && (
              <span className="text-xs text-indigo-600 font-mono font-medium">
                Tip: Click "Run 21-Probe Suite" in the top bar or navigate to "Request Lab" to test payloads.
              </span>
            )}
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className={`rounded-lg border p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                evt.action === 'blocked' || evt.action === 'banned'
                  ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                  : evt.action === 'rate_limited'
                  ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                  : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {getActionBadge(evt.action)}

                  <span className="font-mono text-xs font-semibold text-slate-900">
                    {evt.method} {evt.path}
                  </span>

                  <span className="text-xs text-slate-500">· {evt.client_ip}</span>

                  {evt.primary_category !== 'benign' && (
                    <span className="text-xs font-mono font-medium text-slate-700 uppercase">
                      · {evt.primary_category}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span className="font-mono">{evt.incident_id}</span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    {new Date(evt.ts).toLocaleTimeString()}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums text-slate-700 font-medium">
                    Score: {evt.score}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums text-slate-500">
                    {evt.latency_ms}ms
                  </span>
                  {evt.findings.length > 0 && evt.findings[0].owasp && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-700">OWASP {evt.findings[0].owasp}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onVoiceDebrief(evt)}
                  className="flex items-center gap-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                  title="Have Voice Sentinel debrief this incident"
                >
                  <Volume2 className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Voice Debrief</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectEvent(evt)}
                  className="flex items-center gap-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Inspect</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
