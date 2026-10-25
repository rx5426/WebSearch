import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  BookOpen,
  Terminal,
  Play,
  Copy,
  Check,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  Search,
  Globe,
  CloudSun,
  ShieldCheck,
} from 'lucide-react';

interface QuickEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST';
  path: string;
  queryParam?: string;
  body?: string;
  description: string;
}

const QUICK_ENDPOINTS: QuickEndpoint[] = [
  {
    id: 'search-get-swagger',
    name: 'GET /api/search?q=swagger',
    method: 'GET',
    path: '/api/search?q=swagger',
    description: 'Instant search query for "swagger" across DuckDuckGo, Bing & Wikipedia failover mesh',
  },
  {
    id: 'search-post-swagger',
    name: 'POST /api/search (JSON)',
    method: 'POST',
    path: '/api/search',
    body: JSON.stringify({ query: 'swagger', num: 5, engine: 'auto' }, null, 2),
    description: 'Structured POST search extracting OpenGraph & Schema.org page metadata',
  },
  {
    id: 'crawl-swagger-io',
    name: 'GET /api/crawl?url=swagger.io',
    method: 'GET',
    path: '/api/crawl?url=https://swagger.io',
    description: 'Deep crawl Swagger.io landing page with anti-scraping fingerprinting',
  },
  {
    id: 'status',
    name: 'GET /api/status',
    method: 'GET',
    path: '/api/status',
    description: 'Crawler uptime, engine status, and token bucket rate limiter telemetry',
  },
  {
    id: 'weather',
    name: 'GET /api/weather?location=Tokyo',
    method: 'GET',
    path: '/api/weather?location=Tokyo',
    description: 'Real-time meteorological conditions and 5-day forecast',
  },
  {
    id: 'mcp-tools',
    name: 'POST /mcp (tools/list)',
    method: 'POST',
    path: '/mcp',
    body: JSON.stringify({ jsonrpc: '2.0', id: '1', method: 'tools/list' }, null, 2),
    description: 'Model Context Protocol (MCP) schema for Claude & AI Agents',
  },
];

export const SwaggerTab: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<QuickEndpoint>(QUICK_ENDPOINTS[0]);
  const [customPath, setCustomPath] = useState(QUICK_ENDPOINTS[0].path);
  const [customBody, setCustomBody] = useState(QUICK_ENDPOINTS[0].body || '');
  const [isLoading, setIsLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseLatency, setResponseLatency] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [activeView, setActiveView] = useState<'both' | 'swagger' | 'runner'>('both');

  const handleSelectEndpoint = (ep: QuickEndpoint) => {
    setSelectedEndpoint(ep);
    setCustomPath(ep.path);
    setCustomBody(ep.body || '');
    setResponseData(null);
    setResponseError(null);
    setResponseStatus(null);
    setResponseLatency(null);
  };

  const executeRequest = async () => {
    setIsLoading(true);
    setResponseError(null);
    const start = performance.now();

    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          Accept: 'application/json',
        },
      };

      if (selectedEndpoint.method === 'POST') {
        options.headers = {
          ...options.headers,
          'Content-Type': 'application/json',
        };
        options.body = customBody;
      }

      const res = await fetch(customPath, options);
      const elapsed = Math.round(performance.now() - start);
      setResponseStatus(res.status);
      setResponseLatency(elapsed);

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        setResponseData(json);
      } else {
        const text = await res.text();
        setResponseData({ rawText: text.slice(0, 1000) });
      }

      if (!res.ok) {
        setResponseError(`HTTP error ${res.status}: ${res.statusText}`);
      }
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      setResponseLatency(elapsed);
      setResponseError(err.message || 'Network request failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial request for swagger on first load so user immediately sees results
  useEffect(() => {
    executeRequest();
  }, []);

  const copyResponse = () => {
    if (!responseData) return;
    navigator.clipboard.writeText(JSON.stringify(responseData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Interactive OpenAPI 3.0 & Swagger UI
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                OpenAPI 3.0.3 Verified
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Fully compliant Swagger UI & OpenAPI 3.0 specifications. Try real endpoints directly below or test via the embedded Swagger sandbox.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-1 flex items-center gap-1 text-xs">
              <button
                onClick={() => setActiveView('both')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  activeView === 'both' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => setActiveView('runner')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  activeView === 'runner' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Quick Runner
              </button>
              <button
                onClick={() => setActiveView('swagger')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  activeView === 'swagger' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Swagger Only
              </button>
            </div>

            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Full Swagger Tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="/openapi.json"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <span>openapi.json</span>
              <Terminal className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Quick Endpoint Runner */}
      {(activeView === 'both' || activeView === 'runner') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Live Endpoint Quick Runner
              </h3>
              <span className="text-xs text-slate-400 hidden sm:inline">
                (Click any preset to execute immediately)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Target:</span>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-indigo-300 border border-slate-700">
                {selectedEndpoint.method} {customPath}
              </span>
            </div>
          </div>

          {/* Quick Presets Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {QUICK_ENDPOINTS.map((ep) => {
              const isActive = selectedEndpoint.id === ep.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isActive
                      ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-950 text-white'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        ep.method === 'GET'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-indigo-500/20 text-indigo-300'
                      }`}
                    >
                      {ep.method}
                    </span>
                    {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <div className="text-xs font-mono font-semibold truncate" title={ep.name}>
                    {ep.name}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Request Input & Execute Bar */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <span
              className={`px-3 py-2 rounded-lg font-mono text-xs font-bold self-start sm:self-auto ${
                selectedEndpoint.method === 'GET'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              }`}
            >
              {selectedEndpoint.method}
            </span>

            <input
              type="text"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              placeholder="/api/search?q=swagger"
            />

            <button
              onClick={executeRequest}
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute</span>
                </>
              )}
            </button>
          </div>

          {/* POST Body Editor if applicable */}
          {selectedEndpoint.method === 'POST' && (
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                JSON Request Body:
              </label>
              <textarea
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Live Response Output Viewer */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono text-slate-400">Response:</span>
                {responseStatus !== null && (
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    HTTP {responseStatus}
                  </span>
                )}
                {responseLatency !== null && (
                  <span className="font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {responseLatency}ms
                  </span>
                )}
                {responseData?.totalResults !== undefined && (
                  <span className="font-mono text-indigo-300">
                    Results: {responseData.totalResults}
                  </span>
                )}
                {responseData?.engine && (
                  <span className="font-mono text-amber-300 text-[11px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    Engine: {responseData.engine}
                  </span>
                )}
              </div>

              {responseData && (
                <button
                  onClick={copyResponse}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              )}
            </div>

            <div className="p-4 max-h-[350px] overflow-auto font-mono text-xs text-slate-200">
              {isLoading ? (
                <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Calling {selectedEndpoint.method} {customPath}...</span>
                </div>
              ) : responseError ? (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Execution Error: {responseError}</div>
                    {responseData && (
                      <pre className="mt-2 text-[11px] opacity-80 whitespace-pre-wrap">
                        {JSON.stringify(responseData, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ) : responseData ? (
                <pre className="text-slate-300 leading-relaxed">
                  {JSON.stringify(responseData, null, 2)}
                </pre>
              ) : (
                <div className="text-slate-500 text-center py-6">
                  Click Execute above to run the selected endpoint request.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Embedded Swagger UI Iframe */}
      {(activeView === 'both' || activeView === 'swagger') && (
        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 shadow-2xl space-y-0">
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="font-mono text-slate-300">Swagger UI Sandbox (/docs)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIframeKey(Date.now())}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] flex items-center gap-1 transition-colors"
                title="Reload Swagger UI Iframe"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reload</span>
              </button>
            </div>
          </div>
          <iframe
            key={iframeKey}
            src="/docs"
            title="Swagger UI"
            className="w-full h-[780px] border-none bg-[#0b0f19]"
          />
        </div>
      )}
    </div>
  );
};
