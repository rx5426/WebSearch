import React, { useState } from 'react';
import {
  Cpu,
  Terminal,
  Download,
  Copy,
  Check,
  Play,
  Layers,
  Sparkles,
  Bot,
  ExternalLink,
  Loader2,
  FileCode,
} from 'lucide-react';

export const McpStudioTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'claude-cli' | 'tester' | 'claude-desktop' | 'python-script' | 'fastapi'>('claude-cli');
  const [selectedTool, setSelectedTool] = useState<'Web Search' | 'get_weather' | 'get_time' | 'crawl_url'>('Web Search');
  const [toolArgs, setToolArgs] = useState('{\n  "query": "toyota vios 2026",\n  "num": 4\n}');
  const [mcpResponse, setMcpResponse] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const claudeConfig = `{
  "mcpServers": {
    "crawler-search": {
      "command": "python3",
      "args": ["/absolute/path/to/crawler_search_api.py", "--mcp"],
      "env": {
        "PYTHONUNBUFFERED": "1"
      }
    }
  }
}`;

  const handleToolChange = (tool: 'Web Search' | 'get_weather' | 'get_time' | 'crawl_url') => {
    setSelectedTool(tool);
    setMcpResponse(null);
    if (tool === 'Web Search') {
      setToolArgs('{\n  "query": "toyota vios 2026",\n  "num": 4\n}');
    } else if (tool === 'get_weather') {
      setToolArgs('{\n  "location": "Tokyo"\n}');
    } else if (tool === 'get_time') {
      setToolArgs('{\n  "location": "London"\n}');
    } else if (tool === 'crawl_url') {
      setToolArgs('{\n  "url": "https://developer.mozilla.org/en-US/docs/Web/API"\n}');
    }
  };

  const handleExecuteMcp = async () => {
    setIsLoading(true);
    setMcpResponse(null);

    let parsedArgs = {};
    try {
      parsedArgs = JSON.parse(toolArgs);
    } catch {
      alert('Invalid JSON in arguments');
      setIsLoading(false);
      return;
    }

    const payload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: selectedTool,
        arguments: parsedArgs,
      },
    };

    try {
      const res = await fetch('/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setMcpResponse(data);
    } catch (err: any) {
      setMcpResponse({ error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono font-medium mb-2">
              <Bot className="w-3.5 h-3.5" />
              <span>Model Context Protocol (MCP) Standard</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Python Script & Model Context Protocol (MCP) Studio
            </h1>
            <p className="mt-1 text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Use this crawler, search, weather, and time engine directly as a standalone Python script, an interactive Swagger API,
              or an MCP server for Claude Desktop, Cursor, and autonomous AI agents.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20"
            >
              <span>Swagger UI (/docs)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Sub-tab navigation */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-800/80 pt-4">
          <button
            onClick={() => setActiveSubTab('claude-cli')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              activeSubTab === 'claude-cli' ? 'bg-indigo-600 text-white' : 'bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            Claude CLI Tool ("Web Search")
          </button>
          <button
            onClick={() => setActiveSubTab('tester')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              activeSubTab === 'tester' ? 'bg-indigo-600 text-white' : 'bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            Live MCP Tool Tester
          </button>
          <button
            onClick={() => setActiveSubTab('claude-desktop')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              activeSubTab === 'claude-desktop' ? 'bg-indigo-600 text-white' : 'bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            Claude Desktop / Cursor Config
          </button>
          <button
            onClick={() => setActiveSubTab('python-script')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              activeSubTab === 'python-script' ? 'bg-indigo-600 text-white' : 'bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            Pure Python (Zero-Dependency)
          </button>
          <button
            onClick={() => setActiveSubTab('fastapi')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              activeSubTab === 'fastapi' ? 'bg-indigo-600 text-white' : 'bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            FastAPI Edition
          </button>
        </div>
      </div>

      {/* Sub-tab 0: Claude CLI Tool ("Web Search") */}
      {activeSubTab === 'claude-cli' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold mb-2">
                <span>Claude CLI Compatible • Tool Name: "Web Search"</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Add to Claude CLI in 1 Command
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Connect this resilient crawler directly to your <code>claude</code> terminal CLI. Claude will automatically invoke
                the <strong>"Web Search"</strong> tool whenever you ask it questions about current news, specifications, docs, or web data.
              </p>
            </div>
            <button
              onClick={() => copyText('claude mcp add web-search python3 $(pwd)/crawler_search_api.py --mcp', 'cli-cmd')}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/20"
            >
              {copied === 'cli-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied === 'cli-cmd' ? 'Copied' : 'Copy CLI Command'}</span>
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
            <div className="text-slate-400 font-semibold">1. Add MCP Server to Claude CLI:</div>
            <pre className="text-cyan-300 bg-slate-900 p-3 rounded-lg border border-slate-800 overflow-x-auto">
claude mcp add web-search python3 $(pwd)/crawler_search_api.py --mcp
            </pre>

            <div className="text-slate-400 font-semibold mt-3">2. In Claude CLI, ask anything:</div>
            <pre className="text-emerald-400 bg-slate-900 p-3 rounded-lg border border-slate-800 overflow-x-auto">
{`> What are the latest specifications and prices for Toyota Vios 2026?

Claude: Using tool "Web Search" with query: "toyota vios 2026 specifications price"...
[✓ Extracted 5 ranked results with OpenGraph & Schema metadata]`}
            </pre>

            <div className="text-slate-400 font-semibold mt-3">3. Verify installed tools in Claude CLI:</div>
            <pre className="text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800 overflow-x-auto">
claude mcp list
            </pre>
          </div>
        </div>
      )}

      {/* Sub-tab 1: Interactive MCP Tool Tester */}
      {activeSubTab === 'tester' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-300">MCP TOOL INVOCATION</span>
              <span className="text-[11px] font-mono text-cyan-400">JSON-RPC 2.0</span>
            </div>

            {/* Tool Selector */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">Select MCP Tool:</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Web Search', 'get_weather', 'get_time', 'crawl_url'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleToolChange(t)}
                    className={`px-3 py-2 rounded-lg text-xs font-mono text-left transition-colors border ${
                      selectedTool === t
                        ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">Tool Arguments (JSON):</label>
              <textarea
                rows={6}
                value={toolArgs}
                onChange={(e) => setToolArgs(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleExecuteMcp}
              disabled={isLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg text-xs font-mono flex items-center justify-center gap-2 transition-colors shadow-md shadow-indigo-600/30"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>Execute MCP Tool</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-300">MCP JSON-RPC RESPONSE</span>
              {mcpResponse && (
                <button
                  onClick={() => copyText(JSON.stringify(mcpResponse, null, 2), 'mcp-resp')}
                  className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {copied === 'mcp-resp' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'mcp-resp' ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            <div className="bg-slate-950 rounded-lg border border-slate-800 p-3 min-h-[260px] max-h-[380px] overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-52 text-slate-500 font-mono text-xs space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                  <span>Executing tool via Model Context Protocol...</span>
                </div>
              ) : mcpResponse ? (
                <pre className="text-[11px] font-mono text-slate-200 overflow-x-auto">
                  {JSON.stringify(mcpResponse, null, 2)}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-52 text-slate-600 font-mono text-xs text-center p-4">
                  Select a tool and click "Execute MCP Tool" to view the JSON-RPC response format used by Claude & AI Agents.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Claude Desktop Config */}
      {activeSubTab === 'claude-desktop' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Claude Desktop & Cursor MCP Configuration</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Add this to your Claude Desktop config (<code>claude_desktop_config.json</code>) or Cursor IDE to give Claude real-time web search, crawler, weather, and time capabilities.
              </p>
            </div>
            <button
              onClick={() => copyText(claudeConfig, 'claude')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              {copied === 'claude' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied === 'claude' ? 'Copied' : 'Copy Config'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 overflow-x-auto">
            {claudeConfig}
          </pre>

          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
            <div className="font-bold text-white">How to connect:</div>
            <div>1. Save <code>crawler_search_api.py</code> to your project or home directory.</div>
            <div>2. Open Claude Desktop Settings &gt; Developer &gt; Edit Config (<code>claude_desktop_config.json</code>).</div>
            <div>3. Paste the configuration block above, pointing to your <code>crawler_search_api.py</code> path.</div>
            <div>4. Restart Claude Desktop. Claude now has 4 live tools: <code>search_web</code>, <code>crawl_url</code>, <code>get_weather</code>, and <code>get_time</code>!</div>
          </div>
        </div>
      )}

      {/* Sub-tab 3: Pure Python Script */}
      {activeSubTab === 'python-script' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">crawler_search_api.py (Zero Dependencies)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Runs with Python 3.10 standard library. No <code>pip install</code> needed. Hosts interactive Swagger UI at <code>/docs</code> and MCP over stdio or HTTP.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyText('curl -O http://localhost:3000/crawler_search_api.py\npython3 crawler_search_api.py', 'cmd')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                {copied === 'cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Run Command</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs space-y-3">
            <div className="text-slate-400 font-bold">Terminal Quickstart:</div>
            <pre className="text-emerald-400 bg-slate-900 p-2.5 rounded border border-slate-800 overflow-x-auto">
{`# 1. Run as HTTP API Server with Swagger UI at http://localhost:8000/docs
python3 crawler_search_api.py

# 2. Or run as Model Context Protocol (MCP) server for Claude Desktop / Cursor
python3 crawler_search_api.py --mcp`}
            </pre>
          </div>
        </div>
      )}

      {/* Sub-tab 4: FastAPI Edition */}
      {activeSubTab === 'fastapi' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">fastapi_crawler_api.py (FastAPI + Pydantic)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                For production deployments using FastAPI, Uvicorn, and Pydantic validation.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs space-y-3">
            <div className="text-slate-400 font-bold">Installation & Run:</div>
            <pre className="text-cyan-300 bg-slate-900 p-2.5 rounded border border-slate-800 overflow-x-auto">
{`pip install fastapi uvicorn pydantic
python3 fastapi_crawler_api.py`}
            </pre>
            <div className="text-slate-400">
              Interactive Swagger docs will be immediately accessible at <code>http://localhost:8000/docs</code>.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
