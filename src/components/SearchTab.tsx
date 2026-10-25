import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  Download,
  Loader2,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { SearchResponse } from '../types.ts';
import { ResultCard } from './ResultCard.tsx';
import { WeatherWidget } from './WeatherWidget.tsx';
import { TimeWidget } from './TimeWidget.tsx';

interface SearchTabProps {
  onSearch: (params: {
    query: string;
    num: number;
    crawlMetadata: boolean;
    respectRobots: boolean;
    concurrency: number;
    timeoutMs: number;
  }) => Promise<void>;
  isLoading: boolean;
  searchData: SearchResponse | null;
  error: string | null;
}

const PRESET_QUERIES = [
  'toyota vios 2026',
  'weather in Tokyo',
  'latest time in London',
  'weather in New York',
  'time in Paris',
  'Next.js 15 vs Vite 6 performance benchmarks',
];

export const SearchTab: React.FC<SearchTabProps> = ({ onSearch, isLoading, searchData, error }) => {
  const [query, setQuery] = useState('toyota vios 2026');
  const [showFilters, setShowFilters] = useState(false);
  const [numResults, setNumResults] = useState(6);
  const [crawlMetadata, setCrawlMetadata] = useState(true);
  const [respectRobots, setRespectRobots] = useState(true);
  const [concurrency, setConcurrency] = useState(4);
  const [timeoutMs, setTimeoutMs] = useState(10000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSearch({
      query: query.trim(),
      num: numResults,
      crawlMetadata,
      respectRobots,
      concurrency,
      timeoutMs,
    });
  };

  const handleExportJson = () => {
    if (!searchData) return;
    const blob = new Blob([JSON.stringify(searchData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google-search-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    if (!searchData || !searchData.results) return;
    const headers = ['Rank', 'Title', 'URL', 'Status', 'Latency(ms)', 'Description', 'OG Image', 'Word Count'];
    const rows = searchData.results.map((r) => [
      r.rank,
      `"${(r.title || '').replace(/"/g, '""')}"`,
      `"${r.url}"`,
      r.metadata?.statusCode || 200,
      r.metadata?.latencyMs || 0,
      `"${(r.metadata?.description || r.snippet || '').replace(/"/g, '""')}"`,
      `"${r.metadata?.openGraph?.image || ''}"`,
      r.metadata?.contentMetrics?.wordCount || 0,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google-search-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner / Quick Description */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Anti-Scraping & Rate-Limit Shield Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Google Search & Deep Page Metadata Crawler API
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            Execute Google searches without bot blocks, CAPTCHAs, or IP bans. Concurrently crawls every search
            result to extract OpenGraph cards, Twitter tags, JSON-LD schemas, and headings.
          </p>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter any search query (e.g. Next.js vs Vite benchmarks)..."
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm sm:text-base shadow-inner"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-3 rounded-xl border flex items-center gap-2 text-sm font-medium transition-colors ${
                  showFilters
                    ? 'bg-slate-800 border-indigo-500 text-indigo-300'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Configure search & crawler filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Options</span>
              </button>

              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm sm:text-base shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all flex-shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching & Crawling...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Search & Crawl</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-mono">Suggested:</span>
            {PRESET_QUERIES.map((preset, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQuery(preset);
                }}
                className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Advanced Crawler Controls Drawer */}
          {showFilters && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Number of Results: <span className="text-indigo-400">{numResults}</span>
                </label>
                <input
                  type="range"
                  min="3"
                  max="12"
                  value={numResults}
                  onChange={(e) => setNumResults(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Concurrent Workers: <span className="text-indigo-400">{concurrency}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={concurrency}
                  onChange={(e) => setConcurrency(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Request Timeout: <span className="text-indigo-400">{timeoutMs / 1000}s</span>
                </label>
                <input
                  type="range"
                  min="5000"
                  max="20000"
                  step="1000"
                  value={timeoutMs}
                  onChange={(e) => setTimeoutMs(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="flex flex-col justify-center space-y-2">
                <label className="inline-flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={crawlMetadata}
                    onChange={(e) => setCrawlMetadata(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span className="text-slate-300">Deep Crawl Page Meta</span>
                </label>

                <label className="inline-flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={respectRobots}
                    onChange={(e) => setRespectRobots(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span className="text-slate-300">Respect robots.txt</span>
                </label>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
          <div>
            <div className="font-semibold">Search or Crawl Error</div>
            <p className="mt-0.5 text-xs text-rose-200/80">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl animate-pulse">
            <div className="h-4 bg-slate-800 rounded w-48" />
            <div className="h-4 bg-slate-800 rounded w-24" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 animate-pulse">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-slate-800 rounded-md" />
                <div className="h-4 bg-slate-800 rounded w-64" />
              </div>
              <div className="h-5 bg-slate-800 rounded w-3/4" />
              <div className="h-4 bg-slate-800 rounded w-full" />
              <div className="h-4 bg-slate-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Results View */}
      {searchData && !isLoading && (
        <div className="space-y-4">
          {/* Instant Weather or Time Widget */}
          {searchData.instantAnswer?.type === 'weather' && searchData.instantAnswer.weather && (
            <WeatherWidget weather={searchData.instantAnswer.weather} />
          )}

          {searchData.instantAnswer?.type === 'time' && searchData.instantAnswer.time && (
            <TimeWidget initialTime={searchData.instantAnswer.time} />
          )}

          {/* Gemini Quota Advisory Notice if live-web fallback active */}
          {searchData.geminiQuotaExhausted && (
            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-2.5 text-xs text-indigo-200">
              <Zap className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Live Web Search Shield Active:</span>{' '}
                Gemini free-tier quota reached. Results are seamlessly resolved via the resilient live web engine with stealth anti-scraping headers. You can attach a billing-enabled key in the <strong className="text-white">Settings &gt; Secrets</strong> panel to enable Gemini Google Grounding.
              </div>
            </div>
          )}

          {/* Executive Summary & Grounding Banner */}
          {searchData.summary && (
            <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-indigo-500/30 relative">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-semibold text-indigo-300 uppercase tracking-wider">
                  {searchData.engine === 'google-grounding-api'
                    ? 'Google Search Grounding Summary'
                    : 'Live Web Engine Search Summary'}
                </span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">{searchData.summary}</p>
            </div>
          )}

          {/* Metrics & Actions Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs font-mono">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-slate-400">
                Found <strong className="text-white">{searchData.totalResults}</strong> results
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">
                Execution time: <strong className="text-cyan-400">{(searchData.executionTimeMs / 1000).toFixed(2)}s</strong>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                {searchData.engine === 'google-grounding-api'
                  ? 'Gemini Grounding (0% Ban Rate)'
                  : 'Live Web Stealth Shield (Bypassed Anti-Scraping)'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJson}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                title="Export search and metadata as JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
              <button
                onClick={handleExportCsv}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                title="Export search and metadata as CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-4">
            {searchData.results.map((result) => (
              <ResultCard key={result.id} item={result} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
