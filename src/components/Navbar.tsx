import React from 'react';
import { Search, Globe, Code, ShieldCheck, Terminal, Activity, BookOpen, Bot } from 'lucide-react';
import { SystemStatus } from '../types.ts';

export type NavTab = 'search' | 'crawler' | 'swagger' | 'mcp' | 'playground' | 'defense';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  status: SystemStatus | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, status }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('search')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
              <Globe className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-white tracking-tight">CrawlerSearch</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v1.0 API + MCP
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Search, Metadata Crawler, Weather, Time & MCP
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-1.5">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'search'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>

            <button
              onClick={() => setActiveTab('swagger')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'swagger'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Swagger UI</span>
            </button>

            <button
              onClick={() => setActiveTab('mcp')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'mcp'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Bot className="w-4 h-4 text-cyan-400" />
              <span>Python & MCP</span>
            </button>

            <button
              onClick={() => setActiveTab('crawler')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'crawler'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span className="hidden md:inline">URL Crawler</span>
              <span className="md:hidden">Crawl</span>
            </button>

            <button
              onClick={() => setActiveTab('playground')}
              className={`hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'playground'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>REST Client</span>
            </button>

            <button
              onClick={() => setActiveTab('defense')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'defense'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Anti-Scraping Lab</span>
              <span className="md:hidden">Shield</span>
            </button>
          </nav>

          {/* Telemetry pill */}
          <div className="hidden xl:flex items-center space-x-3 text-xs font-mono">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Swagger: /docs</span>
            </div>
            {status && (
              <div className="text-slate-400 flex items-center space-x-1">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Reqs: {status.engine?.rateLimiter?.totalRequestsSent || 0}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
