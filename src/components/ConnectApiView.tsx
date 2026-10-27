import React, { useState, useEffect } from 'react';
import {
  Server,
  Globe,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Zap,
  ShieldCheck,
  FileCode,
  Layers,
  Info,
  Key,
  Lock,
  ExternalLink,
  BookOpen,
  Volume2,
  AlertCircle
} from 'lucide-react';
import { db, doc, onSnapshot, setDoc } from '../firebase.ts';
import { UserSession } from './LoginPage.tsx';

interface ConnectionStatus {
  activeUpstreamUrl: string;
  activeOpenApiPath: string;
  reachability: 'reachable' | 'unreachable' | 'untested';
  contractValid: boolean;
  apiTitle?: string;
  apiVersion?: string;
  operationsCount?: number;
  discoveredRoutes?: string[];
  lastCheckedAt?: string;
  validationErrors?: string[];
  warnings?: string[];
  activeFromFirestore?: boolean;
}

interface ConnectApiViewProps {
  userSession?: UserSession | null;
  onVoiceDebrief?: (text: string) => void;
  onRefreshData?: () => void;
}

export const ConnectApiView: React.FC<ConnectApiViewProps> = ({
  userSession,
  onVoiceDebrief,
  onRefreshData
}) => {
  const [upstreamUrl, setUpstreamUrl] = useState<string>('http://127.0.0.1:9000');
  const [openApiPath, setOpenApiPath] = useState<string>('/openapi.json');
  const [authToken, setAuthToken] = useState<string>('');

  const [status, setStatus] = useState<ConnectionStatus>({
    activeUpstreamUrl: 'http://127.0.0.1:9000',
    activeOpenApiPath: '/openapi.json',
    reachability: 'untested',
    contractValid: false
  });

  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [activeTabSection, setActiveTabSection] = useState<'config' | 'guide'>('config');

  useEffect(() => {
    const fetchCurrentConfig = async () => {
      try {
        const res = await fetch('/_gk/api/connection');
        if (res.ok) {
          const data = await res.json();
          if (data.activeUpstreamUrl) {
            setStatus(data);
            if (!hasUnsavedChanges) {
              setUpstreamUrl(data.activeUpstreamUrl);
              setOpenApiPath(data.activeOpenApiPath || '/openapi.json');
            }
          }
        }
      } catch (err) {
        console.warn('Gateway connection config sync notice:', err);
      }
    };

    fetchCurrentConfig();

    const unsubscribe = onSnapshot(doc(db, 'gateway_config', 'active'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as ConnectionStatus;
        if (data) {
          setStatus((prev) => ({ ...prev, ...data, activeFromFirestore: true }));
          if (!hasUnsavedChanges && data.activeUpstreamUrl) {
            setUpstreamUrl(data.activeUpstreamUrl);
            setOpenApiPath(data.activeOpenApiPath || '/openapi.json');
          }
        }
      }
    }, (err) => {
      console.warn('Firestore gateway_config notice:', err);
    });

    return () => unsubscribe();
  }, [hasUnsavedChanges]);

  const showToast = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  const handleUrlChange = (val: string) => {
    setUpstreamUrl(val);
    setHasUnsavedChanges(true);
  };

  const handlePathChange = (val: string) => {
    setOpenApiPath(val);
    setHasUnsavedChanges(true);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/_gk/api/connection/test', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession?.token}`
        },
        body: JSON.stringify({
          upstream_url: upstreamUrl.trim(),
          openapi_path: openApiPath.trim(),
          auth_token: authToken.trim() || undefined
        })
      });

      if (res.status === 401) {
        showToast('Your session expired. Sign in again.', 'error');
        return;
      }

      const data = await res.json();
      setTestResult(data);

      if (data.success && data.reachability === 'reachable') {
        showToast(`Backend reachable! Discovered ${data.operationsCount || 0} OpenAPI operations.`, 'success');
      } else {
        showToast(`Connection Check Failed: ${data.error || 'Backend unreachable'}`, 'error');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        reachability: 'unreachable',
        error: err.message || 'Network failure dispatching connection test'
      });
      showToast('Network error testing backend connection', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndActivate = async () => {
    setIsSaving(true);

    try {
      const res = await fetch('/_gk/api/connection', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession?.token}`
        },
        body: JSON.stringify({
          upstream_url: upstreamUrl.trim(),
          openapi_path: openApiPath.trim(),
          auth_token: authToken.trim() || undefined
        })
      });

      if (res.status === 401) {
        showToast('Administrator authorization required.', 'error');
        return;
      }

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus(data.status);
        setHasUnsavedChanges(false);
        setTestResult(null);

        setDoc(doc(db, 'gateway_config', 'active'), {
          ...data.status,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});

        showToast(`Backend "${data.status.activeUpstreamUrl}" is now ACTIVE & protected!`, 'success');
        onRefreshData?.();
      } else {
        showToast(`Failed to activate: ${data.error || 'Invalid configuration'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Error saving configuration: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white border shadow-2xl ${
          toast.type === 'success' ? 'border-emerald-200 text-emerald-800 bg-emerald-50' : 
          toast.type === 'error' ? 'border-rose-200 text-rose-800 bg-rose-50' : 'border-amber-200 text-amber-900 bg-amber-50'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : 
           toast.type === 'error' ? <XCircle className="h-4 w-4 text-rose-600 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />}
          <span className="text-xs font-mono font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <Server className="h-5 w-5 text-indigo-600 shrink-0" />
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase font-sans">
              Connect the API you want to protect
            </h1>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl font-sans">
            Choose where accepted requests go and load your backend's API specification. Gatekeeper validates endpoints, required parameters, and JSON request bodies before forwarding requests.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTabSection('config')}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTabSection === 'config'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Configuration & Status
          </button>

          <button
            type="button"
            onClick={() => setActiveTabSection('guide')}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTabSection === 'guide'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Beginner Guide</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onVoiceDebrief?.(
                `Gateway Configuration Status: Active target backend is ${status.activeUpstreamUrl}. Reachability status: ${status.reachability}. Contract guard status: ${
                  status.contractValid ? 'Valid OpenAPI Contract Loaded' : 'Operating with Fallback Schema'
                }. ${status.operationsCount || 0} operations documented.`
              )
            }
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-indigo-600 transition-all cursor-pointer shadow-2xs"
            title="Spoken Architecture Brief"
          >
            <Volume2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {activeTabSection === 'config' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Upstream Target & OpenAPI Contract Settings</span>
                </h2>
                {hasUnsavedChanges && (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 border border-amber-200 text-amber-800">
                    Unsaved Changes
                  </span>
                )}
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>Backend Base URL (HTTP / HTTPS)</span>
                      <button
                        type="button"
                        onClick={() => {
                          setUpstreamUrl('http://127.0.0.1:9000');
                          setOpenApiPath('/openapi.json');
                          showToast("Loaded Local Lab Settings", "success");
                        }}
                        className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-all text-[9px] font-bold uppercase cursor-pointer shadow-2xs"
                      >
                        Try Local Lab
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">Required Target Base</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={upstreamUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="http://127.0.0.1:9000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                  />
                  <p className="text-[11px] text-slate-500 mt-1 font-sans">
                    Example: <code className="text-indigo-600 font-mono">http://127.0.0.1:9000</code> or <code className="text-indigo-600 font-mono">https://api.mycompany.com</code>
                  </p>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                    <span>OpenAPI Specification Path</span>
                    <span className="text-[10px] text-slate-400 font-normal">Backend-relative Path</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={openApiPath}
                    onChange={(e) => handlePathChange(e.target.value)}
                    placeholder="/openapi.json"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                  />
                  <p className="text-[11px] text-slate-500 mt-1 font-sans">
                    Relative path on backend where OpenAPI specification is exposed (e.g. <code className="text-indigo-600 font-mono">/openapi.json</code>).
                  </p>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                    <span>Spec Fetch Bearer Token (Optional)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Stored securely</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                      placeholder="Bearer token if spec endpoint requires auth"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                    />
                    <Key className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !upstreamUrl.trim()}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-mono font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                      <span>Testing Backend Reachability...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 text-amber-600" />
                      <span>Test Connection</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndActivate}
                  disabled={isSaving || !upstreamUrl.trim()}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Activating Upstream...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Save & Activate Backend</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs space-y-1.5 font-sans">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block font-mono uppercase text-[11px]">Deployment Disclaimer:</strong>
                    <span>Your target backend must already be running and reachable. Saving configures the proxy pipeline without deploying the backend itself.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 pt-1 border-t border-slate-200">
                  <Server className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block font-mono uppercase text-[11px]">Localhost Reference:</strong>
                    <span>When entering <code className="text-indigo-600 font-mono">http://127.0.0.1:9000</code>, localhost refers to the host machine running Gatekeeper.</span>
                    <div className="mt-2">
                      <a 
                        href="/_lab" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-all text-[10px] font-bold uppercase shadow-2xs"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open VulnShop Lab UI
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {testResult && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>Connection & OpenAPI Specification Validation Results</span>
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    testResult.reachability === 'reachable'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-700'
                  }`}>
                    {testResult.reachability === 'reachable' ? 'Backend Reachable' : 'Connection Failed'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">API Title & Version</span>
                    <span className="font-bold text-slate-900 block truncate">
                      {testResult.api_title || 'N/A'} ({testResult.api_version || 'v1.0'})
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Discovered Operations</span>
                    <span className="font-bold text-emerald-700 block tabular-nums">
                      {testResult.operations_count || 0} Routes Parsed
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Contract Guard</span>
                    <span className={`font-bold block ${testResult.contract_valid ? 'text-emerald-700' : 'text-amber-800'}`}>
                      {testResult.contract_valid ? 'OpenAPI 3.x Valid' : 'Schema Warnings'}
                    </span>
                  </div>
                </div>

                {testResult.discovered_routes && testResult.discovered_routes.length > 0 && (
                  <div>
                    <span className="text-[11px] font-mono text-slate-600 uppercase tracking-wider block mb-2">
                      Discovered OpenAPI Operation Routes ({testResult.discovered_routes.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                      {testResult.discovered_routes.map((route: string) => (
                        <span key={route} className="px-2 py-1 rounded bg-white border border-slate-200 text-[11px] font-mono text-indigo-700 shadow-2xs">
                          {route}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {testResult.error && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-mono space-y-2">
                    <div className="flex items-center gap-2 text-rose-700 font-bold uppercase">
                      <AlertCircle className="h-4 w-4" />
                      <span>Connection Error Diagnostics</span>
                    </div>
                    <p className="leading-relaxed">
                      {testResult.error}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Active Protected Backend Status</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-500">Live Proxy Target</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">1. Backend Reachability</span>
                    <span className="font-bold text-slate-900 text-xs">{status.activeUpstreamUrl}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    status.reachability === 'reachable'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-700'
                  }`}>
                    {status.reachability === 'reachable' ? 'Online' : 'Unreachable'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">2. OpenAPI Contract Guard</span>
                    <span className="font-bold text-slate-700 text-xs">
                      {status.apiTitle ? `${status.apiTitle} (${status.apiVersion || 'v1.0'})` : status.activeOpenApiPath}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    status.contractValid
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-amber-50 border border-amber-200 text-amber-800'
                  }`}>
                    {status.contractValid ? 'Validated' : 'Fallback Schema'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">3. Documented Operations</span>
                    <span className="font-bold text-emerald-700 text-xs tabular-nums">
                      {status.operationsCount || 0} Routes Active
                    </span>
                  </div>
                  <Layers className="h-4 w-4 text-emerald-600" />
                </div>
              </div>

              {!status.contractValid && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono space-y-1">
                  <div className="flex items-center gap-1.5 font-bold uppercase">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    <span>Contract Guard Warning</span>
                  </div>
                  <p className="text-[11px] text-amber-800 font-sans leading-relaxed">
                    Operating with wildcard contract fallback. Load a valid OpenAPI specification to enforce strict schema validation.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 font-mono text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-200">
                <Lock className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>Security & Anti-SSRF Controls Enforced</span>
              </h3>
              <div className="space-y-2 text-slate-600 text-[11px]">
                <div className="flex items-center justify-between">
                  <span>Destination Scheme:</span>
                  <span className="text-emerald-700 font-bold">HTTP / HTTPS Only</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Self-Loop Protection:</span>
                  <span className="text-emerald-700 font-bold">Port 3000 Blocked</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cloud Metadata Protection:</span>
                  <span className="text-emerald-700 font-bold">169.254.169.254 Blocked</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Spec Size Limit:</span>
                  <span className="text-emerald-700 font-bold">5 MB Max</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Fetch Timeout:</span>
                  <span className="text-emerald-700 font-bold">5.0s Timeout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-200">
            <h2 className="text-lg font-black text-slate-900 uppercase font-sans flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              <span>Beginner Step-by-Step Walkthrough Guide</span>
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Follow these simple steps to connect your backend API, load its OpenAPI contract, and verify threat protection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-2xs">
              <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                STEP 1
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Start Your Backend API</h3>
              <p className="text-slate-600 font-sans text-xs">
                Launch your target backend API.
              </p>
              <p className="text-[10px] text-indigo-700 font-sans italic mt-1">
                <strong>LAB TIP:</strong> We have bundled a vulnerable clothing store API. Use <code className="text-slate-900 font-mono">http://127.0.0.1:9000</code> to start testing immediately.
              </p>
              <div className="pt-2">
                <a 
                  href="/_lab" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-all text-[10px] font-bold shadow-2xs"
                >
                  <ExternalLink className="h-3 w-3" />
                  OPEN VULNSHOP LAB UI
                </a>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-2xs">
              <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                STEP 2
              </span>
              <h3 className="font-bold text-slate-900 text-sm">OpenAPI Specification Path</h3>
              <p className="text-slate-600 font-sans text-xs">
                This is the API blueprint (JSON or YAML). Common paths: <code className="text-indigo-600 font-mono">/openapi.json</code>, <code className="text-indigo-600 font-mono">/swagger.json</code>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-2xs">
              <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                STEP 3
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Enter URL & Spec Path</h3>
              <p className="text-slate-600 font-sans text-xs">
                Enter your backend URL and spec path into the configuration form on the left.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-2xs">
              <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                STEP 4
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Click "Test Connection"</h3>
              <p className="text-slate-600 font-sans text-xs">
                Gatekeeper executes a server-side health check, fetches your OpenAPI document, parses routes, and verifies schema structure.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
