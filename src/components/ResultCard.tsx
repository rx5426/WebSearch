import React, { useState } from 'react';
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Shield,
  Code2,
  Share2,
  Layers,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { SearchResultItem } from '../types.ts';

interface ResultCardProps {
  item: SearchResultItem;
}

export const ResultCard: React.FC<ResultCardProps> = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'meta' | 'og' | 'schema' | 'content' | 'raw'>('preview');
  const [copied, setCopied] = useState(false);

  const meta = item.metadata;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all shadow-sm">
      {/* Top Header / Result Summary */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {/* Rank badge */}
            <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center">
              #{item.rank}
            </span>

            {/* Title, Favicon & URL */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                {meta?.favicon ? (
                  <img
                    src={meta.favicon}
                    alt=""
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="w-4 h-4 rounded-sm object-contain flex-shrink-0"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-sm bg-slate-800 flex-shrink-0" />
                )}
                <span className="text-xs font-mono text-slate-400 truncate max-w-sm sm:max-w-md">
                  {item.displayUrl}
                </span>
                {item.sourceEngine && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold border ${
                    item.sourceEngine.includes('duckduckgo')
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : item.sourceEngine.includes('bing')
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                      : item.sourceEngine.includes('wikipedia')
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                  }`}>
                    {item.sourceEngine.includes('duckduckgo-html') || item.sourceEngine.includes('duckduckgo_html')
                      ? 'DDG HTML'
                      : item.sourceEngine.includes('duckduckgo')
                      ? 'DDG'
                      : item.sourceEngine.includes('bing')
                      ? 'Bing'
                      : item.sourceEngine.includes('wikipedia')
                      ? 'Wikipedia'
                      : item.sourceEngine.includes('news')
                      ? 'Google News'
                      : 'Google'}
                  </span>
                )}
              </div>

              <h3 className="text-base sm:text-lg font-semibold text-white hover:text-indigo-400 transition-colors">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5">
                  <span>{item.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
                </a>
              </h3>

              <p className="mt-1.5 text-sm text-slate-300 line-clamp-2 leading-relaxed">
                {item.snippet}
              </p>
            </div>
          </div>
        </div>

        {/* Telemetry & Badges Row */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {meta ? (
              <>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {meta.statusCode} {meta.statusText || 'OK'}
                </span>

                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  {meta.latencyMs}ms
                </span>

                {meta.contentMetrics && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono flex items-center gap-1">
                    <FileText className="w-3 h-3 text-amber-400" />
                    {meta.contentMetrics.wordCount.toLocaleString()} words
                  </span>
                )}

                {meta.antiBotStatus && (
                  <span
                    className={`px-2 py-0.5 rounded-md font-mono flex items-center gap-1 ${
                      meta.antiBotStatus.challengeDetected
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                    }`}
                  >
                    <Shield className="w-3 h-3" />
                    {meta.antiBotStatus.challengeDetected
                      ? 'WAF Warning Detected'
                      : `Anti-Bot: Passed (${meta.antiBotStatus.retriesCount} retries)`}
                  </span>
                )}
              </>
            ) : item.crawlError ? (
              <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Crawl note: {item.crawlError}
              </span>
            ) : (
              <span className="text-slate-500 font-mono">Metadata not crawled</span>
            )}
          </div>

          {meta && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-200 font-medium transition-colors text-xs"
            >
              <span>{isExpanded ? 'Hide Page Metadata' : 'Inspect Page Metadata'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Metadata Inspector Drawer */}
      {isExpanded && meta && (
        <div className="border-t border-slate-800 bg-slate-950/70 p-4 sm:p-5">
          {/* Sub-tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Social Preview</span>
              </button>

              <button
                onClick={() => setActiveTab('meta')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === 'meta'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Core Meta</span>
              </button>

              <button
                onClick={() => setActiveTab('og')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === 'og'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>OpenGraph & Twitter</span>
              </button>

              <button
                onClick={() => setActiveTab('schema')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === 'schema'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>JSON-LD ({meta.jsonLd?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('content')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === 'content'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Content & Headings</span>
              </button>

              <button
                onClick={() => setActiveTab('raw')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === 'raw'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Raw JSON</span>
              </button>
            </div>

            <button
              onClick={() => copyToClipboard(JSON.stringify(meta, null, 2))}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>

          {/* Sub-tab 1: Social Card Preview */}
          {activeTab === 'preview' && (
            <div className="max-w-xl mx-auto my-2">
              <p className="text-xs text-slate-400 mb-2 font-mono">
                Simulated OpenGraph / Twitter Card preview:
              </p>
              <div className="border border-slate-700/80 rounded-xl overflow-hidden bg-slate-900 shadow-md">
                {meta.preview.image ? (
                  <div className="relative aspect-video w-full bg-slate-950 overflow-hidden border-b border-slate-800">
                    <img
                      src={meta.preview.image}
                      alt={meta.preview.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="aspect-[21/9] w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center border-b border-slate-800">
                    <span className="text-xs font-mono text-slate-400">No og:image specified</span>
                  </div>
                )}
                <div className="p-4">
                  <div className="text-xs font-mono text-indigo-400 uppercase tracking-wider mb-1">
                    {meta.preview.domain}
                  </div>
                  <h4 className="font-semibold text-white text-sm sm:text-base line-clamp-2">
                    {meta.preview.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {meta.preview.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 2: Core Meta Table */}
          {activeTab === 'meta' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono border-collapse">
                <tbody>
                  <tr className="border-b border-slate-800/80">
                    <td className="py-2 px-3 text-slate-400 w-36 font-semibold">Title</td>
                    <td className="py-2 px-3 text-slate-200">{meta.title || '-'}</td>
                  </tr>
                  <tr className="border-b border-slate-800/80">
                    <td className="py-2 px-3 text-slate-400 font-semibold">Description</td>
                    <td className="py-2 px-3 text-slate-200">{meta.description || '-'}</td>
                  </tr>
                  <tr className="border-b border-slate-800/80">
                    <td className="py-2 px-3 text-slate-400 font-semibold">Canonical URL</td>
                    <td className="py-2 px-3 text-cyan-400 break-all">{meta.canonical || '-'}</td>
                  </tr>
                  <tr className="border-b border-slate-800/80">
                    <td className="py-2 px-3 text-slate-400 font-semibold">Language</td>
                    <td className="py-2 px-3 text-slate-200">{meta.language || 'not specified'}</td>
                  </tr>
                  <tr className="border-b border-slate-800/80">
                    <td className="py-2 px-3 text-slate-400 font-semibold">Author</td>
                    <td className="py-2 px-3 text-slate-200">{meta.author || '-'}</td>
                  </tr>
                  <tr className="border-b border-slate-800/80">
                    <td className="py-2 px-3 text-slate-400 font-semibold">Robots Directive</td>
                    <td className="py-2 px-3 text-emerald-400">{meta.robotsDirective || 'index, follow (default)'}</td>
                  </tr>
                  <tr className="border-b border-slate-800/80">
                    <td className="py-2 px-3 text-slate-400 font-semibold">Keywords</td>
                    <td className="py-2 px-3 text-slate-300">
                      {meta.keywords && meta.keywords.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {meta.keywords.map((k, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                              {k}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-400 font-semibold">Server / Headers</td>
                    <td className="py-2 px-3 text-slate-300">
                      Server: {meta.server || 'hidden'}, Content-Type: {meta.contentType}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Sub-tab 3: OpenGraph & Twitter */}
          {activeTab === 'og' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                <h5 className="text-xs font-semibold text-indigo-400 font-mono mb-2 border-b border-slate-800 pb-1">
                  OpenGraph Tags (og:*)
                </h5>
                <div className="space-y-1.5 text-xs font-mono">
                  {Object.entries(meta.openGraph).map(([key, val]) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-baseline">
                      <span className="text-slate-400 sm:w-28 flex-shrink-0">og:{key}:</span>
                      <span className="text-slate-200 break-all">{val ? String(val) : <em className="text-slate-600">null</em>}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                <h5 className="text-xs font-semibold text-cyan-400 font-mono mb-2 border-b border-slate-800 pb-1">
                  Twitter Card Tags (twitter:*)
                </h5>
                <div className="space-y-1.5 text-xs font-mono">
                  {Object.entries(meta.twitter).map(([key, val]) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-baseline">
                      <span className="text-slate-400 sm:w-28 flex-shrink-0">twitter:{key}:</span>
                      <span className="text-slate-200 break-all">{val ? String(val) : <em className="text-slate-600">null</em>}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 4: Schema.org JSON-LD */}
          {activeTab === 'schema' && (
            <div>
              {meta.jsonLd && meta.jsonLd.length > 0 ? (
                <div className="space-y-3">
                  {meta.jsonLd.map((schema, idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800">
                        <span className="text-xs font-mono font-semibold text-amber-400">
                          Schema #{idx + 1}: @type = {schema.type || 'Object'}
                        </span>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(schema.raw, null, 2))}
                          className="text-[11px] font-mono text-slate-400 hover:text-white"
                        >
                          Copy Schema
                        </button>
                      </div>
                      <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 p-2 rounded bg-slate-950">
                        {JSON.stringify(schema.raw, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 font-mono text-xs">
                  No &lt;script type="application/ld+json"&gt; schema tags detected on this page.
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 5: Content & Headings */}
          {activeTab === 'content' && meta.contentMetrics && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
                  <div className="text-slate-400 text-xs">Word Count</div>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">
                    {meta.contentMetrics.wordCount.toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
                  <div className="text-slate-400 text-xs">Est. Reading Time</div>
                  <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                    {meta.contentMetrics.readingTimeMinutes} min
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
                  <div className="text-slate-400 text-xs">Internal Links</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                    {meta.contentMetrics.linksCount.internal}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
                  <div className="text-slate-400 text-xs">External Links</div>
                  <div className="text-lg font-bold font-mono text-indigo-400 mt-0.5">
                    {meta.contentMetrics.linksCount.external}
                  </div>
                </div>
              </div>

              {meta.contentMetrics.h1s && meta.contentMetrics.h1s.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                  <div className="text-xs font-semibold font-mono text-slate-300 mb-2">
                    Primary H1 Headings ({meta.contentMetrics.h1s.length})
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-200 font-sans">
                    {meta.contentMetrics.h1s.map((h, i) => (
                      <li key={i} className="line-clamp-1">
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 6: Raw JSON */}
          {activeTab === 'raw' && (
            <pre className="text-[11px] font-mono text-slate-300 bg-slate-950 p-3 rounded-lg overflow-x-auto max-h-72 border border-slate-800">
              {JSON.stringify(meta, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
