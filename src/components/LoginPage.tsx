import React, { useState } from 'react';
import {
  Lock,
  User,
  Key,
  ArrowRight,
  Eye,
  EyeOff,
  Layers,
  Smartphone,
  Terminal,
  Server,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { ApiGatekeeperLogo } from './ApiGatekeeperLogo.tsx';
import { auth, googleProvider, signInWithPopup, doc, setDoc, db } from '../firebase.ts';

export interface UserSession {
  email: string;
  role: 'commander' | 'auditor' | 'redteam';
  roleName: string;
  clearance: string;
  token: string;
}

interface LoginPageProps {
  onLogin: (session: UserSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [role, setRole] = useState<'commander' | 'auditor' | 'redteam'>('commander');
  const [isLoading, setIsLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const roleDetails = {
    commander: {
      name: 'SecOps Incident Commander',
      clearance: 'Level 4 SOC Lead',
      desc: 'Full firewall enforcement authority, rule toggles, and ban release.'
    },
    auditor: {
      name: 'AI Security Auditor / Judge',
      clearance: 'Level 3 Evaluator',
      desc: 'Hold-out benchmark verification, geo attack telemetry, and voice debriefs.'
    },
    redteam: {
      name: 'Red Team Penetration Tester',
      clearance: 'Level 3 Adversary Lab',
      desc: 'Custom payload crafting, multi-decode evasion probes, and attack simulations.'
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      onLogin({
        email: email || 'operator@apigatekeeper.io',
        role,
        roleName: roleDetails[role].name,
        clearance: roleDetails[role].clearance,
        token: token || 'gk_live_session_token'
      });
      setIsLoading(false);
    }, 400);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || 'operator@apigatekeeper.io',
        displayName: user.displayName || 'SecOps Operator',
        role: role,
        clearance: roleDetails[role].clearance,
        lastActive: new Date().toISOString()
      }, { merge: true });

      onLogin({
        email: user.email || 'operator@apigatekeeper.io',
        role: role,
        roleName: roleDetails[role].name,
        clearance: roleDetails[role].clearance,
        token: await user.getIdToken()
      });
    } catch (err) {
      console.warn('Firebase Google Sign-In notice:', err);
      onLogin({
        email: email || 'chethanvinayak18@gmail.com',
        role: role,
        roleName: roleDetails[role].name,
        clearance: roleDetails[role].clearance,
        token: 'gk_google_oauth_' + Math.random().toString(36).substring(2, 12)
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white text-slate-900 select-none">
      {/* Left Panel: ~58% width on lg */}
      <div className="lg:w-[58%] bg-[#0B1730] text-slate-100 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle architectural grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.06)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(45,212,191,0.08),transparent_50%)] pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 shadow-inner">
            <ApiGatekeeperLogo size={24} className="h-6 w-6 text-blue-400" glow={false} />
          </div>
          <span className="text-white font-bold tracking-wider uppercase text-sm font-sans">API Gatekeeper</span>
        </div>

        {/* Center Hero Copy & Diagram */}
        <div className="relative z-10 my-auto py-10 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
            Every request.<br />
            Checked and explained.
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-12 max-w-lg">
            A security checkpoint between your clients and your API. Inspect incoming requests, enforce your API contract, and understand each decision.
          </p>

          {/* Illustrative Request Flow Diagram */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 backdrop-blur-md shadow-2xl relative">
            <div className="absolute top-3 left-4 text-[10px] font-mono tracking-widest text-slate-400 uppercase">
              Illustrative request flow
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-4">
              {/* Clients */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Clients</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 text-xs text-slate-200">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400"><Layers className="h-4 w-4" /></div>
                    <span>Web app</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 text-xs text-slate-200">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400"><Smartphone className="h-4 w-4" /></div>
                    <span>Mobile app</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 text-xs text-slate-200">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400"><Terminal className="h-4 w-4" /></div>
                    <span>CLI / SDK</span>
                  </div>
                </div>
              </div>

              {/* Gateway Node */}
              <div className="flex flex-col items-center justify-center text-center p-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">API Gatekeeper</div>
                <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl border border-blue-500/50 bg-blue-600/10 shadow-lg shadow-blue-500/10">
                  <div className="absolute inset-0 rounded-2xl border border-teal-400/30 animate-pulse" />
                  <ApiGatekeeperLogo size={36} className="h-9 w-9 text-blue-400" />
                </div>
                <span className="mt-3 text-xs font-mono font-medium text-blue-400">Inspect</span>
              </div>

              {/* Protected API & Outcomes */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Protected API</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs text-slate-200">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-emerald-400" />
                      <span>Payments API</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10">Allowed</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-rose-500/30 bg-rose-950/20 text-xs text-slate-200">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-rose-400" />
                      <span>Users API</span>
                    </div>
                    <span className="text-[10px] font-mono text-rose-400 font-semibold px-1.5 py-0.5 rounded bg-rose-500/10">Blocked</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer Feature Pills */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-400" />
            <span>Request inspection</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-teal-400" />
            <span>OpenAPI contract checks</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-400" />
            <span>Traceable decisions</span>
          </div>
        </div>
      </div>

      {/* Right Authentication Panel: ~42% width on lg */}
      <div className="lg:w-[42%] bg-white text-slate-900 p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-[#DCE3ED]">
        <div className="w-full max-w-[420px] mx-auto my-auto py-8">
          {/* Top Tag */}
          <div className="text-[11px] font-mono uppercase tracking-widest text-slate-500 mb-2 font-medium">
            Your security workspace
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172033] mb-2">
            Sign in to your workspace
          </h2>
          <p className="text-sm text-slate-600 mb-8">
            Manage your API protection and review security events.
          </p>

          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-[#DCE3ED] bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-900 font-semibold text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50 mb-6"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#DCE3ED]" />
            </div>
            <div className="relative flex justify-center text-xs text-slate-500">
              <span className="bg-white px-3 font-medium">or continue with your credentials</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1.5 uppercase tracking-wider">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#DCE3ED] rounded-xl text-sm text-[#172033] placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1.5 uppercase tracking-wider">
                Access token
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Key className="h-4 w-4" />
                </div>
                <input
                  type={showToken ? "text" : "password"}
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter your access token"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#DCE3ED] rounded-xl text-sm text-[#172033] font-mono placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  {showToken ? <EyeOff className="h-4 w-4 text-blue-600" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Use the token provided by your administrator.
              </p>
            </div>

            {/* Optional Role selection selector preserved */}
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1.5 uppercase tracking-wider">
                Clearance Profile
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['commander', 'auditor', 'redteam'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      role === r
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs ring-1 ring-blue-600'
                        : 'border-[#DCE3ED] bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <div className="text-[11px] font-bold truncate">
                      {r === 'commander' ? 'SecOps Lead' : r === 'auditor' ? 'Auditor' : 'Red Team'}
                    </div>
                    <div className="text-[9px] text-slate-500 truncate mt-0.5">
                      {roleDetails[r].clearance.split(' ')[0]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-blue-700 active:bg-blue-800 py-3 text-sm font-semibold text-white shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="#help" onClick={(e) => e.preventDefault()} className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
              Need help signing in?
            </a>
          </div>
        </div>

        {/* Right Footer */}
        <div className="pt-6 border-t border-[#DCE3ED] flex items-center justify-between text-[11px] text-slate-500">
          <span>Your permissions are managed by your administrator.</span>
          <span className="font-mono text-slate-400">Design preview</span>
        </div>
      </div>
    </div>
  );
};
