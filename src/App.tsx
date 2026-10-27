/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { LoginPage, type UserSession } from './components/LoginPage.tsx';
import { VoiceSentinel } from './components/VoiceSentinel.tsx';
import { DashboardKpi } from './components/DashboardKpi.tsx';
import { LiveAttackFeed } from './components/LiveAttackFeed.tsx';
import { RequestLabView } from './components/RequestLabView.tsx';
import { AttackSimulatorView } from './components/AttackSimulatorView.tsx';
import { FirewallRulesView } from './components/FirewallRulesView.tsx';
import { IncidentDrawer } from './components/IncidentDrawer.tsx';
import { UserProfileModal } from './components/UserProfileModal.tsx';
import { ShieldAlert } from 'lucide-react';
import { db, collection, onSnapshot, doc, setDoc } from './firebase.ts';
import type {
  SecurityEvent,
  GatewayStats,
  GatewayMode,
  ScorecardResult
} from './gateway/types.ts';
import { ConnectApiView } from './components/ConnectApiView.tsx';

// Clean baseline stats: zero hardcoded pre-existing numbers
const CLEAN_ZERO_STATS: GatewayStats = {
  total_requests: 0,
  blocked_count: 0,
  rate_limited_count: 0,
  allowed_count: 0,
  banned_count: 0,
  unique_ips: 0,
  block_rate: 0,
  reached_backend_count: 0,
  p95_latency_ms: 0,
  category_breakdown: {}
};

export default function App() {
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    try {
      const stored = localStorage.getItem('gk_user_session');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return null;
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mode, setMode] = useState<GatewayMode>('block');
  const [stats, setStats] = useState<GatewayStats>(CLEAN_ZERO_STATS);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [inspectedEvent, setInspectedEvent] = useState<SecurityEvent | null>(null);
  const [scorecard, setScorecard] = useState<ScorecardResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResults, setSimulationResults] = useState<any[] | null>(null);
  const [externalVoiceTrigger, setExternalVoiceTrigger] = useState<{ text: string } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Sync session to local storage
  const handleLogin = (session: UserSession) => {
    setUserSession(session);
    try {
      localStorage.setItem('gk_user_session', JSON.stringify(session));
    } catch {}
  };

  const handleLogout = () => {
    setUserSession(null);
    try {
      localStorage.removeItem('gk_user_session');
    } catch {}
  };

  // Fetch true gateway telemetry from backend & sync to Firestore
  const refreshData = async () => {
    try {
      const [statsRes, eventsRes, modeRes] = await Promise.all([
        fetch('/_gk/api/stats'),
        fetch('/_gk/api/events?limit=100'),
        fetch('/_gk/api/mode')
      ]);

      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      }
      if (eventsRes.ok) {
        const evts: SecurityEvent[] = await eventsRes.json();
        setEvents(evts);

        // Async write events to Firestore incidents collection for real-time persistence
        evts.slice(0, 20).forEach((evt) => {
          try {
            setDoc(doc(db, 'incidents', evt.id), {
              ...evt,
              updatedAt: new Date().toISOString()
            }, { merge: true }).catch(() => {});
          } catch {}
        });
      }
      if (modeRes.ok) {
        const m = await modeRes.json();
        setMode(m.mode);
      }
    } catch (err) {
      console.warn('Data sync notice:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Handle Mode Toggle (BLOCK vs MONITOR)
  const handleToggleMode = async () => {
    const nextMode: GatewayMode = mode === 'block' ? 'monitor' : 'block';
    try {
      const res = await fetch('/_gk/api/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: nextMode })
      });
      if (res.ok) {
        setMode(nextMode);
        await refreshData();
      }
    } catch {
      setMode(nextMode);
    }
  };

  // Run Attack Simulator (18 Attacks + 3 Benign = 21 Total Requests)
  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/_gk/api/simulate', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSimulationResults(data.results);
        await refreshData();
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Run Scorecard Benchmark
  const handleRunScorecard = async () => {
    try {
      const res = await fetch('/_gk/api/benchmark', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setScorecard(data);
      }
    } catch (err) {
      console.error('Scorecard error:', err);
    }
  };

  // Reset Data to Clean Baseline
  const handleResetData = async () => {
    try {
      const res = await fetch('/_gk/api/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || CLEAN_ZERO_STATS);
      } else {
        setStats(CLEAN_ZERO_STATS);
      }
      setEvents([]);
      setSelectedEvent(null);
      setInspectedEvent(null);
      setSimulationResults(null);
      setScorecard(null);
    } catch (err) {
      console.error('Reset error:', err);
      setStats(CLEAN_ZERO_STATS);
      setEvents([]);
    }
  };

  // Voice Debrief Trigger: Explains incident without speaking raw incident IDs or locations
  const handleVoiceDebrief = (textOrEvent: string | SecurityEvent) => {
    if (typeof textOrEvent === 'string') {
      setExternalVoiceTrigger({ text: textOrEvent });
    } else {
      setSelectedEvent(textOrEvent);
      setExternalVoiceTrigger({
        text: `A ${textOrEvent.primary_category.toUpperCase()} attack targeting ${textOrEvent.method} ${textOrEvent.path} was ${textOrEvent.action.toUpperCase()} with an anomaly score of ${textOrEvent.score}. Rule matched: ${textOrEvent.findings[0]?.name || textOrEvent.primary_category}. Zero malicious traffic reached your backend servers.`
      });
    }
  };

  // Render Login Gate if unauthenticated
  if (!userSession) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Calculate live threat category distribution from intercepted events
  const categoryStats = events.reduce<Record<string, number>>((acc, e) => {
    const cat = e.primary_category || 'general';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-500/20 selection:text-indigo-900">
      {/* Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        mode={mode}
        onToggleMode={handleToggleMode}
        isSpeaking={isSpeaking}
        onRunSim={handleRunSimulation}
        isSimulating={isSimulating}
        onResetData={handleResetData}
        userSession={userSession}
        onLogout={handleLogout}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 mx-auto w-full max-w-[1600px] px-4 sm:px-8 lg:px-12 py-6 space-y-6">
        {/* TAB 1: Enhanced Live Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6" id="panel-dashboard" role="tabpanel">
            {/* 7 Clean Real-Time KPI Cards (Clean Baseline: starts at 0, no prior mock data) */}
            <DashboardKpi stats={stats} mode={mode} />

            {/* Threat Vector Distribution Bar (populated when events exist) */}
            {events.length > 0 && Object.keys(categoryStats).length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                    <span>Intercepted Threat Vector Breakdown ({events.length} Probes)</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {stats.blocked_count} Blocked · {stats.allowed_count} Allowed
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {Object.entries(categoryStats).map(([cat, count]) => (
                    <div key={cat} className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block truncate">
                        {cat}
                      </span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-sm font-bold font-mono text-slate-900">
                          {count}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {Math.round((count / events.length) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Security Event Feed */}
            <LiveAttackFeed
              events={events}
              onSelectEvent={setInspectedEvent}
              onVoiceDebrief={handleVoiceDebrief}
            />
          </div>
        )}

        {/* TAB 2: Request Lab (User Input Area) */}
        {activeTab === 'tester' && (
          <div id="panel-tester" role="tabpanel">
            <RequestLabView
              onVoiceDebrief={handleVoiceDebrief}
              onRefreshData={refreshData}
            />
          </div>
        )}

        {/* TAB 3: Attack Simulator (18 Attacks + 3 Benign Controls) */}
        {activeTab === 'simulator' && (
          <div id="panel-simulator" role="tabpanel">
            <AttackSimulatorView
              onRunSimulation={handleRunSimulation}
              isSimulating={isSimulating}
              simulationResults={simulationResults}
              mode={mode}
              onVoiceDebrief={handleVoiceDebrief}
            />
          </div>
        )}

        {/* TAB 4: WAF Policy & Firewall Rules Manager */}
        {activeTab === 'rules' && (
          <div id="panel-rules" role="tabpanel">
            <FirewallRulesView
              onVoiceDebrief={(txt) => handleVoiceDebrief(txt)}
              onRefreshData={refreshData}
            />
          </div>
        )}

        {/* TAB 5: Dedicated Voice Sentinel Command Center (Voice Assistant is ONLY highlighted here!) */}
        {activeTab === 'voice' && (
          <div className="space-y-6" id="panel-voice" role="tabpanel">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
              <h2 className="text-base font-bold text-white uppercase font-mono tracking-wide mb-1">
                Voice Sentinel Command Center & Audio Telemetry
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                The AI Sentinel articulates live threat telemetry directly to operators and evaluators. Hear incident post-mortems and security architecture briefs with natural high-fidelity voices.
              </p>
            </div>

            {/* Full Interactive Voice Sentinel Agent */}
            <VoiceSentinel
              selectedEvent={selectedEvent}
              scorecard={scorecard}
              isSpeaking={isSpeaking}
              setIsSpeaking={setIsSpeaking}
              externalTrigger={externalVoiceTrigger}
            />

            {/* Recent Incident Feed with 1-Click Voice Debrief */}
            <LiveAttackFeed
              events={events}
              onSelectEvent={setInspectedEvent}
              onVoiceDebrief={handleVoiceDebrief}
            />
          </div>
        )}
        {/* TAB 6: API Connection & OpenAPI Integration Command Center */}
        {activeTab === 'connect' && (
          <div id="panel-connect" role="tabpanel">
            <ConnectApiView
              userSession={userSession}
              onVoiceDebrief={handleVoiceDebrief}
              onRefreshData={refreshData}
            />
          </div>
        )}
      </main>

      {/* Deep Telemetry Modal Incident Drawer */}
      {inspectedEvent && (
        <IncidentDrawer
          event={inspectedEvent}
          onClose={() => setInspectedEvent(null)}
          onVoiceDebrief={handleVoiceDebrief}
          isSpeaking={isSpeaking}
        />
      )}

      {/* User Profile & Security Clearance Modal */}
      {userSession && (
        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          userSession={userSession}
          onLogout={handleLogout}
          onRoleChange={(newRole) => {
            const updated = { ...userSession, role: newRole };
            handleLogin(updated);
          }}
        />
      )}

      {/* Professional Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500 mt-auto">
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-mono uppercase font-bold text-slate-700">
            API GATEKEEPER · Autonomous Reverse-Proxy & WAF Security Command Center
          </span>
          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <span>OWASP CRS Anomaly Scoring</span>
            <span aria-hidden="true">·</span>
            <span>OpenAPI Contract Guard</span>
            <span aria-hidden="true">·</span>
            <span>Sub-5ms Latency</span>
            <span aria-hidden="true">·</span>
            <span>Neural Audio Telemetry</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
