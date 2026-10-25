import React from 'react';
import { Shield, ShieldAlert, Cpu, Zap, Activity, CheckCircle2, Lock, ArrowRight, Layers } from 'lucide-react';
import { SystemStatus } from '../types.ts';

interface AntiScrapingLabTabProps {
  status: SystemStatus | null;
}

export const AntiScrapingLabTab: React.FC<AntiScrapingLabTabProps> = ({ status }) => {
  const rateLimiter = status?.engine?.rateLimiter;

  const layers = [
    {
      num: 1,
      title: 'Official Google Search Grounding',
      subtitle: 'Zero CAPTCHAs & Zero Google 429 IP Blocks',
      description:
        'Scraping google.com directly via raw HTTP requests instantly triggers reCAPTCHA challenges and IP blacklisting. By integrating Google Search Grounding with Gemini 3.8 Flash, queries execute via verified Google infrastructure, providing real-time Google search index results with guaranteed 0% ban rates.',
      badge: 'Unblockable Google Search',
      color: 'indigo',
    },
    {
      num: 2,
      title: 'Stealth Browser Fingerprints & Client Hints',
      subtitle: 'Modern Chrome 133 / Firefox 134 Header Pool',
      description:
        'Anti-bot WAFs (Cloudflare, Akamai, Datadome) flag automated crawlers that lack modern browser headers. Our engine attaches authentic sec-ch-ua, sec-ch-ua-mobile, sec-fetch-dest, sec-fetch-mode, and gzip/brotli compression headers, mimicking genuine browser sessions.',
      badge: 'Browser Fingerprint Pool',
      color: 'cyan',
    },
    {
      num: 3,
      title: 'Per-Domain Token-Bucket Rate Limiter',
      subtitle: 'Polite Inter-Request Jitter & Domain Isolation',
      description:
        'Hitting the same target domain too quickly is the primary trigger for HTTP 429 Too Many Requests. The in-memory scheduler isolates domains and enforces a minimum delay (600ms - 1500ms) with randomized jitter between consecutive requests to the same origin.',
      badge: 'Per-Host Throttling',
      color: 'emerald',
    },
    {
      num: 4,
      title: 'Exponential Backoff with Jitter on 429/503',
      subtitle: 'Retry-After Header Compliance',
      description:
        'If a destination server responds with 429 (Too Many Requests) or 503 (Service Unavailable), the crawler parses the Retry-After header. If absent, it automatically backs off exponentially (1.5s, 3.0s, 6.0s) plus random jitter before retrying up to 2 times.',
      badge: 'Graceful Recovery',
      color: 'amber',
    },
    {
      num: 5,
      title: 'Robots.txt Parser & Compliance',
      subtitle: 'Polite Path Authorization & Crawl-Delay',
      description:
        'Fetches and parses the target domain robots.txt, checking Disallow and Allow directives for both specific bot signatures and wildcard (*). Honors explicit Crawl-delay parameters to maintain compliance with webmasters.',
      badge: 'Ethical Crawling',
      color: 'blue',
    },
    {
      num: 6,
      title: 'Timeout Guard & Size Limits',
      subtitle: 'Memory & Connection Drain Protection',
      description:
        'Utilizes modern AbortController with configurable 10-second timeouts to eliminate hung connections. Enforces a 5MB payload limit to prevent memory exhaustion when encountering large binary files or zip bombs.',
      badge: 'Resource Guard',
      color: 'rose',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">
            Anti-Scraping & Rate-Limiting Architecture Lab
          </h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          Learn how this crawler API solves the two greatest hurdles in web scraping: Google Search bot blocks
          and target website rate limiting. Below is the multi-layered defense mechanism currently protecting
          every API request.
        </p>

        {/* Live Metrics Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono">
          <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3">
            <div className="text-slate-400 text-xs">Total Requests Sent</div>
            <div className="text-xl font-bold text-white mt-1">
              {rateLimiter?.totalRequestsSent ?? 0}
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3">
            <div className="text-slate-400 text-xs">Politely Throttled</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {rateLimiter?.totalThrottled ?? 0}
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3">
            <div className="text-slate-400 text-xs">Backoff Retries</div>
            <div className="text-xl font-bold text-amber-400 mt-1">
              {rateLimiter?.totalRetried ?? 0}
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3">
            <div className="text-slate-400 text-xs">Tracked Domains</div>
            <div className="text-xl font-bold text-cyan-400 mt-1">
              {rateLimiter?.trackedDomains ?? 0}
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3">
            <div className="text-slate-400 text-xs">Active In-Flight</div>
            <div className="text-xl font-bold text-indigo-400 mt-1">
              {rateLimiter?.activeRequests ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* 6 Defense Layers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {layers.map((layer) => (
          <div
            key={layer.num}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center border border-indigo-500/20">
                  {layer.num}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-800 text-slate-300">
                  {layer.badge}
                </span>
              </div>
              <h3 className="font-semibold text-white text-base">{layer.title}</h3>
              <div className="text-xs font-mono text-cyan-400 mb-2">{layer.subtitle}</div>
              <p className="text-xs text-slate-300 leading-relaxed">{layer.description}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center text-xs font-mono text-emerald-400 gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active in Production</span>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison: Naive Scraper vs Resilient API */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-base font-semibold text-white mb-4">
          Architectural Comparison: Standard Scraping vs Resilient Crawler API
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-400">
                <th className="py-2.5 px-3">Feature</th>
                <th className="py-2.5 px-3 text-rose-400">Naive Scraper (requests/curl)</th>
                <th className="py-2.5 px-3 text-emerald-400">This Crawler Search API</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-2.5 px-3 text-slate-300 font-semibold">Google Search Retrieval</td>
                <td className="py-2.5 px-3 text-rose-300">HTTP 429 / reCAPTCHA Block</td>
                <td className="py-2.5 px-3 text-emerald-300">Official Grounding (0% Block Rate)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-300 font-semibold">User-Agent Headers</td>
                <td className="py-2.5 px-3 text-rose-300">curl/7.88 or python-requests/2.x</td>
                <td className="py-2.5 px-3 text-emerald-300">Chrome 133 + sec-ch-ua hints</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-300 font-semibold">Rate Limiting Handling</td>
                <td className="py-2.5 px-3 text-rose-300">Crashes or gets permanently banned</td>
                <td className="py-2.5 px-3 text-emerald-300">Token-bucket queue & exponential backoff</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-300 font-semibold">Metadata Extraction</td>
                <td className="py-2.5 px-3 text-rose-300">Basic title tag regex only</td>
                <td className="py-2.5 px-3 text-emerald-300">OpenGraph, Twitter, JSON-LD, Word count</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-300 font-semibold">Robots.txt Policy</td>
                <td className="py-2.5 px-3 text-rose-300">Ignored (risks server IP abuse reports)</td>
                <td className="py-2.5 px-3 text-emerald-300">Evaluated & cached with Crawl-delay</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
