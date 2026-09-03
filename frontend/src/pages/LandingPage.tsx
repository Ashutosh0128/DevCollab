import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getHealthStatus } from '../services/api';
import { ShieldCheck, Cpu, Database, GitBranch, Layers, CheckCircle2, Server, Terminal, RefreshCw } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { data: health, isLoading, isError, refetch, error } = useQuery({
    queryKey: ['health'],
    queryFn: getHealthStatus,
    refetchInterval: 10000,
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                DevCollab
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800/50">
                Phase 1 Live
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-md">
              <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
              <span>siddhi-work</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-6">
            <ShieldCheck className="w-4 h-4" />
            <span>Infrastructure Scaffolding Verified</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-100 mb-4">
            AI-Powered Developer Collaboration Platform
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            DevCollab unifies project tracking, team discussions, GitHub activity, and embedded AI intelligence into one context-aware workflow.
          </p>
        </div>

        {/* System Health Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full mb-12">
          {/* Card 1: Frontend Status */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Cpu className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Online
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-200">React Frontend</h3>
              <p className="text-sm text-slate-400 mt-1">Vite + TypeScript + Tailwind CSS client runtime operational.</p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Port: 5173</span>
              <span>React 19</span>
            </div>
          </div>

          {/* Card 2: Backend API Status */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Server className="w-6 h-6" />
                </div>
                {isLoading ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                    Connecting...
                  </span>
                ) : isError ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Offline
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Connected
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-slate-200">Django REST API</h3>
              <p className="text-sm text-slate-400 mt-1">
                Health Endpoint: <code className="text-indigo-300 font-mono text-xs">/api/v1/health/</code>
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Status:</span>
              <span className={isError ? "text-rose-400" : "text-emerald-400 font-semibold"}>
                {isLoading ? "Checking..." : isError ? "Unreachable" : JSON.stringify(health?.status || "ok")}
              </span>
            </div>
          </div>

          {/* Card 3: PostgreSQL Status */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Database className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Configured
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-200">PostgreSQL DB</h3>
              <p className="text-sm text-slate-400 mt-1">Environment variable database routing enabled.</p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Port: 5432</span>
              <span>Postgres 16</span>
            </div>
          </div>
        </div>

        {/* Live API Health Diagnostics Panel */}
        <div className="max-w-5xl mx-auto w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-semibold text-slate-200">API Health Diagnostics</h4>
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh Check</span>
            </button>
          </div>

          <div className="p-6 font-mono text-xs text-slate-300 bg-slate-950/80">
            {isLoading ? (
              <div className="text-slate-500">Executing GET /api/v1/health/...</div>
            ) : isError ? (
              <div className="text-rose-400">
                [ERROR] Failed to query backend API endpoint.
                <br />
                <span className="text-slate-500">Details: {(error as Error)?.message || 'Connection refused'}</span>
              </div>
            ) : (
              <div>
                <span className="text-emerald-400">HTTP 200 OK</span> - Response received from server:
                <pre className="mt-2 p-3 rounded-lg bg-slate-900 border border-slate-800 text-emerald-300 overflow-x-auto">
                  {JSON.stringify(health, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Phase Checklist */}
        <div className="max-w-5xl mx-auto w-full mt-12">
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Phase 1 Infrastructure Checklist
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "React + TS + Vite",
              "Tailwind CSS styling",
              "TanStack Query + Axios",
              "Django + DRF backend",
              "PostgreSQL integration",
              ".env.example configuration",
              "Docker Compose environment",
              "Health check (/api/v1/health/)",
            ].map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        DevCollab &copy; 2026 — Phase 1 Project Initialization Completed. Awaiting approval for Phase 2.
      </footer>
    </div>
  );
};
