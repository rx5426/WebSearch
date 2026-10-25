import React, { useState } from 'react';
import { Globe, Play, CheckCircle2, AlertCircle, FileCode, Shield, Loader2, RefreshCw } from 'lucide-react';
import { CrawlMetadata } from '../types.ts';
import { ResultCard } from './ResultCard.tsx';

export const CrawlUrlTab: React.FC = () => {
  const [mode, setMode] = useState<'single' | 'batch' | 'robots'>('single');
  const [url, setUrl] = useState('https://github.com');
  const [batchUrls, setBatchUrls] = useState(
    'https://developer.mozilla.org/en-US/docs/Web/API\nhttps://ogp.me\nhttps://nodejs.org'
  );
  const [respectRobots, setRespectRobots] = useState(true);
  const [timeoutMs, setTimeoutMs] = useState(12000);

  const [isLoading, setIsLoading] = useState(false);
  const [singleResult, setSingleResult] = useState<CrawlMetadata | null>(null);
  const [batchResults, setBatchResults] = useState<any[] | null>(null);
  const [robotsResult, setRobotsResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCrawlSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setSingleResult(null);

    try {
      const res = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          respectRobots,
          timeoutMs,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to crawl URL');
      }

      setSingleResult(data);
    } catch (err: any) {
      setError(err.message || 'Crawl request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrawlBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const urls = batchUrls
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.startsWith('http://') || u.startsWith('https://'));

    if (urls.length === 0 || isLoading) return;

    setIsLoading(true);
    setError(null);
    setBatchResults(null);

    try {
      const res = await fetch('/api/crawl/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls,
          concurrency: 3,
          respectRobots,
          timeoutMs,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Batch crawl failed');
      }

      setBatchResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Batch crawl failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckRobots = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setRobotsResult(null);

    try {
      const res = await fetch(`/api/robots-check?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to check robots.txt');
      }
      setRobotsResult(data);
    } catch (err: any) {
      setError(err.message || 'Error checking robots.txt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="flex border-b border-slate-800 pb-3 gap-2">
        <button
          onClick={() => {
            setMode('single');
            setError(null);
          }}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            mode === 'single' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Single Page Crawler
        </button>
        <button
          onClick={() => {
            setMode('batch');
            setError(null);
          }}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            mode === 'batch' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Batch URLs Crawler
        </button>
        <button
          onClick={() => {
            setMode('robots');
            setError(null);
          }}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            mode === 'robots' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Robots.txt Inspector
        </button>
      </div>

      {/* Mode 1: Single URL Crawler Form */}
      {mode === 'single' && (
        <form onSubmit={handleCrawlSingle} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Target Web Page Metadata Extraction</span>
            </h2>
            <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Stealth Headers & Auto-Retry Enabled</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/page"
              required
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 transition-colors flex-shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>Crawl & Extract</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
            <label className="inline-flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={respectRobots}
                onChange={(e) => setRespectRobots(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-indigo-600"
              />
              <span>Respect robots.txt</span>
            </label>

            <div className="flex items-center space-x-2">
              <span>Timeout:</span>
              <select
                value={timeoutMs}
                onChange={(e) => setTimeoutMs(parseInt(e.target.value, 10))}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-300"
              >
                <option value={8000}>8 seconds</option>
                <option value={12000}>12 seconds</option>
                <option value={20000}>20 seconds</option>
              </select>
            </div>
          </div>
        </form>
      )}

      {/* Mode 2: Batch URLs Form */}
      {mode === 'batch' && (
        <form onSubmit={handleCrawlBatch} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span>Batch Queue Crawler (Concurrency Controlled)</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">Max 15 URLs per batch</span>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5">
              Enter target URLs (one per line):
            </label>
            <textarea
              rows={4}
              value={batchUrls}
              onChange={(e) => setBatchUrls(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>Launch Batch Crawl Queue</span>
          </button>
        </form>
      )}

      {/* Mode 3: Robots.txt Inspector */}
      {mode === 'robots' && (
        <form onSubmit={handleCheckRobots} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Robots.txt Validator & Directives Inspector</span>
          </h2>
          <p className="text-xs text-slate-300">
            Check if your crawler is allowed to index a URL under the domain's robots.txt policy and inspect crawl-delay.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/path"
              required
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 transition-colors flex-shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>Inspect Robots.txt</span>
            </button>
          </div>
        </form>
      )}

      {/* Error Output */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
          <div>
            <div className="font-semibold">Crawler Error</div>
            <p className="mt-0.5 text-xs text-rose-200/80">{error}</p>
          </div>
        </div>
      )}

      {/* Output 1: Single Result Display */}
      {singleResult && (
        <div className="space-y-4">
          <h3 className="text-sm font-mono text-slate-400 uppercase tracking-wider">Crawl Result:</h3>
          <ResultCard
            item={{
              id: 'crawl-single',
              rank: 1,
              title: singleResult.title || singleResult.url,
              url: singleResult.finalUrl || singleResult.url,
              displayUrl: singleResult.finalUrl || singleResult.url,
              snippet: singleResult.description || 'Crawled web page metadata.',
              metadata: singleResult,
            }}
          />
        </div>
      )}

      {/* Output 2: Batch Results Display */}
      {batchResults && (
        <div className="space-y-4">
          <h3 className="text-sm font-mono text-slate-400 uppercase tracking-wider">
            Batch Crawl Results ({batchResults.length} URLs):
          </h3>
          <div className="space-y-4">
            {batchResults.map((item, idx) => (
              <div key={idx}>
                {item.success && item.data ? (
                  <ResultCard
                    item={{
                      id: `batch-${idx}`,
                      rank: idx + 1,
                      title: item.data.title || item.url,
                      url: item.data.finalUrl || item.url,
                      displayUrl: item.data.finalUrl || item.url,
                      snippet: item.data.description || 'Crawled metadata.',
                      metadata: item.data,
                    }}
                  />
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900 border border-rose-500/30 text-xs font-mono space-y-1">
                    <div className="text-slate-400 font-semibold">{item.url}</div>
                    <div className="text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{item.error || 'Failed to crawl'}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Output 3: Robots.txt Output */}
      {robotsResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold text-white">Target URL:</span>
              <span className="text-xs font-mono text-cyan-400">{robotsResult.url}</span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
                robotsResult.allowed
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {robotsResult.allowed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{robotsResult.allowed ? 'Crawling Allowed' : 'Crawling Disallowed'}</span>
            </span>
          </div>

          <div className="text-xs font-mono text-slate-300">
            <strong>Evaluation Reason:</strong> {robotsResult.reason}
            {robotsResult.crawlDelay && (
              <span className="ml-3 text-amber-400">
                (Declared Crawl-Delay: {robotsResult.crawlDelay}s)
              </span>
            )}
          </div>

          <div>
            <div className="text-xs font-mono font-semibold text-slate-400 mb-1.5">
              Sample rules from robots.txt ({robotsResult.domainData?.rules?.length || 0} user-agent blocks found):
            </div>
            <pre className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono text-slate-300 max-h-56 overflow-y-auto border border-slate-800">
              {robotsResult.domainData?.rawSample || 'robots.txt was empty or unreachable (allowed by default)'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
