import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar.tsx';
import { SearchTab } from './components/SearchTab.tsx';
import { CrawlUrlTab } from './components/CrawlUrlTab.tsx';
import { SwaggerTab } from './components/SwaggerTab.tsx';
import { McpStudioTab } from './components/McpStudioTab.tsx';
import { ApiPlaygroundTab } from './components/ApiPlaygroundTab.tsx';
import { AntiScrapingLabTab } from './components/AntiScrapingLabTab.tsx';
import { SearchResponse, SystemStatus } from './types.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('search');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Poll system status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
      }
    } catch {
      // Ignore background status polling errors
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  // Execute Search & Crawl
  const handleSearch = async (params: {
    query: string;
    num: number;
    crawlMetadata: boolean;
    respectRobots: boolean;
    concurrency: number;
    timeoutMs: number;
    engine?: string;
  }) => {
    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete search & crawl');
      }

      setSearchData(data);
      fetchStatus();
    } catch (err: any) {
      setSearchError(err.message || 'An error occurred during search');
    } finally {
      setIsSearching(false);
    }
  };

  // Perform initial search for 'toyota vios 2026' on first load as requested
  useEffect(() => {
    handleSearch({
      query: 'toyota vios 2026',
      num: 5,
      crawlMetadata: true,
      respectRobots: true,
      concurrency: 4,
      timeoutMs: 12000,
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} status={systemStatus} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'search' && (
          <SearchTab
            onSearch={handleSearch}
            isLoading={isSearching}
            searchData={searchData}
            error={searchError}
          />
        )}

        {activeTab === 'swagger' && <SwaggerTab />}

        {activeTab === 'mcp' && <McpStudioTab />}

        {activeTab === 'crawler' && <CrawlUrlTab />}

        {activeTab === 'playground' && <ApiPlaygroundTab />}

        {activeTab === 'defense' && <AntiScrapingLabTab status={systemStatus} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            CrawlerSearch API • Google Search Grounding & Resilient Page Metadata Extractor
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>Node.js / Express</span>
            <span>•</span>
            <span>Python SDK</span>
            <span>•</span>
            <span>Anti-Scraping Shield</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
