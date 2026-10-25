import React, { useState } from 'react';
import { Terminal, Play, Copy, Check, Send, Code, Database, Clock } from 'lucide-react';

interface EndpointConfig {
  method: 'GET' | 'POST';
  path: string;
  description: string;
  defaultBody?: string;
  defaultQuery?: string;
}

const ENDPOINTS: EndpointConfig[] = [
  {
    method: 'POST',
    path: '/api/search',
    description: 'Execute Google search and concurrently crawl page metadata for each result',
    defaultBody: JSON.stringify(
      {
        query: 'toyota vios 2026',
        num: 5,
        crawlMetadata: true,
        respectRobots: true,
        concurrency: 4,
        timeoutMs: 10000,
      },
      null,
      2
    ),
  },
  {
    method: 'POST',
    path: '/api/crawl',
    description: 'Deep crawl single web page for OpenGraph, Twitter, and Schema.org metadata',
    defaultBody: JSON.stringify(
      {
        url: 'https://developer.mozilla.org/en-US/docs/Web/API',
        respectRobots: true,
        timeoutMs: 12000,
      },
      null,
      2
    ),
  },
  {
    method: 'POST',
    path: '/api/crawl/batch',
    description: 'Batch crawl multiple URLs with rate-limiting and domain throttling queue',
    defaultBody: JSON.stringify(
      {
        urls: ['https://ogp.me', 'https://github.com', 'https://nodejs.org'],
        concurrency: 3,
        respectRobots: true,
      },
      null,
      2
    ),
  },
  {
    method: 'GET',
    path: '/api/weather',
    description: 'Retrieve real-time meteorological conditions, temperature, and 5-day forecast',
    defaultQuery: '?location=Tokyo',
  },
  {
    method: 'GET',
    path: '/api/time',
    description: 'Retrieve live timezone-aware local time, UTC offset, and day of week',
    defaultQuery: '?location=London',
  },
  {
    method: 'GET',
    path: '/api/robots-check',
    description: 'Inspect robots.txt compliance and crawl-delay for target domain',
    defaultQuery: '?url=https://github.com/explore',
  },
  {
    method: 'GET',
    path: '/api/status',
    description: 'Inspect live rate-limiter stats, queue depth, and health telemetry',
  },
];

export const ApiPlaygroundTab: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointConfig>(ENDPOINTS[0]);
  const [requestBody, setRequestBody] = useState(selectedEndpoint.defaultBody || '');
  const [queryString, setQueryString] = useState(selectedEndpoint.defaultQuery || '');
  const [isLoading, setIsLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string> | null>(null);
  const [responseData, setResponseData] = useState<any | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSelectEndpoint = (ep: EndpointConfig) => {
    setSelectedEndpoint(ep);
    setRequestBody(ep.defaultBody || '');
    setQueryString(ep.defaultQuery || '');
    setResponseStatus(null);
    setResponseData(null);
  };

  const handleSend = async () => {
    setIsLoading(true);
    setResponseStatus(null);
    setResponseData(null);
    const start = Date.now();

    const fullUrl = `${selectedEndpoint.path}${queryString}`;

    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: { 'Content-Type': 'application/json' },
      };

      if (selectedEndpoint.method === 'POST') {
        options.body = requestBody;
      }

      const res = await fetch(fullUrl, options);
      const elapsed = Date.now() - start;
      setLatencyMs(elapsed);
      setResponseStatus(res.status);

      const headersObj: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        headersObj[key] = val;
      });
      setResponseHeaders(headersObj);

      const data = await res.json();
      setResponseData(data);
    } catch (err: any) {
      setResponseStatus(500);
      setResponseData({ error: err.message || 'Request failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const copyResponse = () => {
    if (!responseData) return;
    navigator.clipboard.writeText(JSON.stringify(responseData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-1">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span>Interactive REST API Client & Playground</span>
        </h2>
        <p className="text-xs text-slate-400">
          Execute live HTTP requests against the local backend server. Test payloads, view response status codes,
          and inspect returned headers and JSON trees.
        </p>

        {/* Endpoint Selector Tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          {ENDPOINTS.map((ep) => (
            <button
              key={ep.path}
              onClick={() => handleSelectEndpoint(ep)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all ${
                selectedEndpoint.path === ep.path
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <span
                className={`text-[10px] px-1 py-0.5 rounded font-bold ${
                  ep.method === 'POST' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {ep.method}
              </span>
              <span>{ep.path}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Column */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300">HTTP REQUEST</span>
            <span className="text-xs text-slate-500 font-mono">{selectedEndpoint.description}</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs font-mono">
            <span
              className={`px-2 py-0.5 rounded font-bold ${
                selectedEndpoint.method === 'POST' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {selectedEndpoint.method}
            </span>
            <span className="text-white font-semibold">{selectedEndpoint.path}</span>
            {selectedEndpoint.method === 'GET' && (
              <input
                type="text"
                value={queryString}
                onChange={(e) => setQueryString(e.target.value)}
                placeholder="?param=value"
                className="flex-1 bg-transparent border-none text-cyan-400 focus:outline-none"
              />
            )}
          </div>

          {selectedEndpoint.method === 'POST' && (
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">JSON Payload Body:</label>
              <textarea
                rows={10}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={isLoading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg text-xs font-mono flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
          >
            {isLoading ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{isLoading ? 'Executing Request...' : 'Send Request'}</span>
          </button>
        </div>

        {/* Response Column */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-300">HTTP RESPONSE</span>
              {responseStatus !== null && (
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                    responseStatus >= 200 && responseStatus < 300
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {responseStatus}
                </span>
              )}
              {latencyMs !== null && (
                <span className="text-xs font-mono text-slate-400">({latencyMs}ms)</span>
              )}
            </div>

            {responseData && (
              <button
                onClick={copyResponse}
                className="inline-flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-white"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          <div className="bg-slate-950 rounded-lg border border-slate-800 p-3 min-h-[300px] max-h-[460px] overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500 font-mono text-xs space-y-2">
                <Clock className="w-6 h-6 animate-spin text-indigo-400" />
                <span>Executing search & crawler pipeline...</span>
              </div>
            ) : responseData ? (
              <pre className="text-[11px] font-mono text-slate-200 overflow-x-auto">
                {JSON.stringify(responseData, null, 2)}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-600 font-mono text-xs">
                Click "Send Request" to view live JSON response
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
