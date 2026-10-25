import React from 'react';
import { ExternalLink, ShieldCheck, Terminal, BookOpen } from 'lucide-react';

export const SwaggerTab: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Interactive OpenAPI 3.0 & Swagger UI
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              No Auth Required
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Official interactive Swagger documentation. Test endpoints, try search queries, crawl URLs, and inspect
            weather & time schemas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span>Open in Full Tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <span>Raw openapi.json</span>
            <Terminal className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Embedded Swagger UI Iframe */}
      <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 shadow-2xl">
        <iframe
          src="/docs"
          title="Swagger UI"
          className="w-full h-[750px] border-none"
        />
      </div>
    </div>
  );
};
