import React from 'react';
import {
  ShieldAlert,
  Volume2,
  Play,
  RotateCcw,
  Sparkles,
  User,
  LogOut
} from 'lucide-react';
import type { GatewayMode } from '../gateway/types.ts';
import type { UserSession } from './LoginPage.tsx';
import { ApiGatekeeperLogo } from './ApiGatekeeperLogo.tsx';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  mode: GatewayMode;
  onToggleMode: () => void;
  isSpeaking: boolean;
  onRunSim: () => void;
  isSimulating: boolean;
  onResetData: () => void;
  userSession: UserSession | null;
  onLogout: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  mode,
  onToggleMode,
  isSpeaking,
  onRunSim,
  isSimulating,
  onResetData,
  userSession,
  onLogout,
  onOpenProfile
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-8 lg:px-12">
        {/* Zone 1: Brand Logo & Uppercase Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onTabChange('dashboard');
            }}
            className="flex items-center gap-3 text-left group"
          >
            {/* Custom Cyber Shield / Gatekeeper Logo */}
            <ApiGatekeeperLogo size={36} className="h-9 w-9 text-indigo-600" glow={false} />

            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-black tracking-widest text-slate-900 uppercase font-mono">
                API GATEKEEPER
              </span>
            </div>
          </a>

          {userSession && (
            <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              {userSession.clearance}
            </span>
          )}
        </div>

        {/* Zone 2: Primary Clean Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2 text-xs font-semibold" role="tablist" aria-label="Main Navigation">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'dashboard'}
            aria-controls="panel-dashboard"
            onClick={() => onTabChange('dashboard')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Live Dashboard
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'tester'}
            aria-controls="panel-tester"
            onClick={() => onTabChange('tester')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'tester'
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="User Input Area: Test custom HTTP payloads & preloaded scenarios"
          >
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>Request Lab</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'simulator'}
            aria-controls="panel-simulator"
            onClick={() => onTabChange('simulator')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Attack Simulator
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'rules'}
            aria-controls="panel-rules"
            onClick={() => onTabChange('rules')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Rules
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'voice'}
            aria-controls="panel-voice"
            onClick={() => onTabChange('voice')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'voice'
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Voice Sentinel</span>
            {isSpeaking && (
              <span className="text-indigo-600 animate-pulse" aria-label="Sentinel is speaking">
                <Volume2 className="h-3.5 w-3.5" />
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'connect'}
            aria-controls="panel-connect"
            onClick={() => onTabChange('connect')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'connect'
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Connect API
          </button>
        </nav>

        {/* Zone 3: Control Actions & Operator Session */}
        <div className="flex items-center gap-2.5 shrink-0">

          {/* Reset Telemetry Button */}
          <button
            type="button"
            onClick={onResetData}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer shadow-2xs"
            title="Reset all attack events & bans to clean baseline (zero)"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Run 21-Probe Suite Button */}
          <button
            type="button"
            onClick={onRunSim}
            disabled={isSimulating}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer"
            title="Dispatches 21 HTTP requests: 18 attack vectors + 3 benign controls"
          >
            <Play className="h-3 w-3 fill-white" />
            <span>{isSimulating ? 'Testing...' : 'Run 21-Probe Suite'}</span>
          </button>

          {/* Operator Profile & Logout Controls */}
          {userSession && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-300 text-slate-800 text-xs font-mono transition-all cursor-pointer shadow-2xs group"
                title="View Operator Profile & Clearance Details"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-[10px]">
                  {userSession.email.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline font-semibold group-hover:text-indigo-600 transition-colors">
                  Profile
                </span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer shadow-2xs"
                title={`Logged in as ${userSession.roleName}. Click to logout.`}
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Sub-bar */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 border-t border-slate-200 bg-white text-xs scrollbar-none">
        <button
          type="button"
          onClick={() => onTabChange('dashboard')}
          className={`px-3 py-1 rounded-md whitespace-nowrap font-medium ${activeTab === 'dashboard' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600'}`}
        >
          Dashboard
        </button>
        <button
          type="button"
          onClick={() => onTabChange('tester')}
          className={`px-3 py-1 rounded-md whitespace-nowrap font-medium ${activeTab === 'tester' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600'}`}
        >
          Request Lab
        </button>
        <button
          type="button"
          onClick={() => onTabChange('simulator')}
          className={`px-3 py-1 rounded-md whitespace-nowrap font-medium ${activeTab === 'simulator' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600'}`}
        >
          Simulator
        </button>
        <button
          type="button"
          onClick={() => onTabChange('rules')}
          className={`px-3 py-1 rounded-md whitespace-nowrap font-medium ${activeTab === 'rules' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600'}`}
        >
          Rules
        </button>
        <button
          type="button"
          onClick={() => onTabChange('voice')}
          className={`px-3 py-1 rounded-md whitespace-nowrap font-medium ${activeTab === 'voice' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600'}`}
        >
          Voice Sentinel
        </button>
        <button
          type="button"
          onClick={() => onTabChange('connect')}
          className={`px-3 py-1 rounded-md whitespace-nowrap font-medium ${activeTab === 'connect' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600'}`}
        >
          Connect API
        </button>
      </div>
    </header>
  );
};
