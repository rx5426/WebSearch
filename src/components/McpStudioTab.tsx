import React, { useState, useEffect, useRef } from 'react';
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
  Radio,
  Wifi,
  WifiOff,
  Send,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Activity,
} from 'lucide-react';

interface SseLogEvent {
  id: string;
  time: string;
  type: string;
  data: string;
  raw?: any;
}

export const McpStudioTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'sse' | 'claude-cli' | 'tester' | 'claude-desktop' | 'python-script' | 'fastapi'>('sse');
  const [selectedTool, setSelectedTool] = useState<'Web Search' | 'get_weather' | 'get_time' | 'crawl_url'>('Web Search');
  const [toolArgs, setToolArgs] = useState('{\n  "query": "toyota vios 2026",\n  "num": 4\n}');
  const [mcpResponse, setMcpResponse] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // SSE State
  const [sseStatus, setSseStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [discoveredEndpoint, setDiscoveredEndpoint] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sseEvents, setSseEvents] = useState<SseLogEvent[]>([]);
  const [ssePostPayload, setSsePostPayload] = useState<string>(
    JSON.stringify(
      {
        jsonrpc: '2.0',
        id: 'msg-1',
        method: 'tools/call',
        params: {
          name: 'Web Search',
          arguments: {
            query: 'toyota vios 2026',
            num: 3,
          },
        },
      },
      null,
      2
    )
  );
  const [isSendingSsePost, setIsSendingSsePost] = useState(false);
  const [postStatusMessage, setPostStatusMessage] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const eventsEndRef = useRef<HTMLDivElement | null>(null);

  // Connect to SSE stream
  const connectSse = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setSseStatus('connecting');
    const es = new EventSource('/sse');
    eventSourceRef.current = es;

    const addEvent = (type: string, data: string, raw?: any) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString() + '.' + String(now.getMilliseconds()).padStart(3, '0');
      setSseEvents((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          time: timeStr,
          type,
          data,
          raw,
        },
      ]);
    };

    es.onopen = () => {
      setSseStatus('connected');
      addEvent('connection', 'Connected to SSE stream at /sse');
    };

    es.addEventListener('endpoint', (e: MessageEvent) => {
      setDiscoveredEndpoint(e.data);
      try {
        const url = new URL(e.data, window.location.origin);
        const sid = url.searchParams.get('sessionId');
        if (sid) {
          setActiveSessionId(sid);
        }
      } catch {
        const match = e.data.match(/sessionId=([^&]+)/);
        if (match) setActiveSessionId(match[1]);
      }
      addEvent('endpoint', `Server advertised message endpoint: ${e.data}`);
    });

    es.addEventListener('message', (e: MessageEvent) => {
      let parsed = null;
      try {
        parsed = JSON.parse(e.data);
      } catch {}
      addEvent('message', e.data, parsed);
    });

    es.onerror = () => {
      setSseStatus('error');
      addEvent('error', 'SSE connection error or closed by server');
    };
  };

  const disconnectSse = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setSseStatus('disconnected');
    setDiscoveredEndpoint(null);
    setActiveSessionId(null);
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleSendSsePost = async (customPayload?: any) => {
    if (!activeSessionId && !discoveredEndpoint) {
      alert('Please connect to the SSE stream first to receive a valid sessionId');
      return;
    }

    setIsSendingSsePost(true);
    setPostStatusMessage(null);

    let payloadToSend: any = null;
    if (customPayload) {
      payloadToSend = customPayload;
    } else {
      try {
        payloadToSend = JSON.parse(ssePostPayload);
      } catch {
        alert('Invalid JSON in request payload');
        setIsSendingSsePost(false);
        return;
      }
    }

    const postUrl = discoveredEndpoint || `/messages?sessionId=${activeSessionId}`;

    try {
      const res = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadToSend),
      });

      if (res.status === 202 || res.ok) {
        setPostStatusMessage(`✓ HTTP 202 Accepted. Response will arrive over the SSE stream below!`);
      } else {
        const errText = await res.text();
        setPostStatusMessage(`Error ${res.status}: ${errText}`);
      }
    } catch (err: any) {
      setPostStatusMessage(`Request error: ${err.message}`);
    } finally {
      setIsSendingSsePost(false);
    }
  };

  const handlePreset = (type: 'initialize' | 'tools/list' | 'web_search' | 'weather' | 'time') => {
    let payload: any = {};
    if (type === 'initialize') {
      payload = {
        jsonrpc: '2.0',
        id: `init-${Date.now()}`,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'mcp-web-tester', version: '1.0' },
        },
      };
    } else if (type === 'tools/list') {
      payload = {
        jsonrpc: '2.0',
        id: `list-${Date.now()}`,
        method: 'tools/list',
      };
    } else if (type === 'web_search') {
      payload = {
        jsonrpc: '2.0',
        id: `search-${Date.now()}`,
        method: 'tools/call',
        params: {
          name: 'Web Search',
          arguments: { query: 'toyota vios 2026', num: 3 },
        },
      };
    } else if (type === 'weather') {
      payload = {
        jsonrpc: '2.0',
        id: `weather-${Date.now()}`,
        method: 'tools/call',
        params: {
          name: 'get_weather',
          arguments: { location: 'Tokyo' },
        },
      };
    } else if (type === 'time') {
      payload = {
        jsonrpc: '2.0',
        id: `time-${Date.now()}`,
        method: 'tools/call',
        params: {
          name: 'get_time',
          arguments: { location: 'London' },
        },
      };
    }

    setSsePostPayload(JSON.stringify(payload, null, 2));
    if (activeSessionId) {
      handleSendSsePost(payload);
    }
  };

  const claudeConfig = `{
  "mcpServers": {
    "crawler-search-sse": {
      "url": "http://localhost:3000/sse"
    },
    "crawler-search-stdio": {
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
              <span>Model Context Protocol (MCP) SSE & JSON-RPC Standard</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              MCP SSE Transport & Tool Studio
            </h1>
            <p className="mt-1 text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Real-time Server-Sent Events (SSE) transport for Claude Desktop, Cursor, Continue, and AI agents.
              Equipped with Google Search grounding, OpenGraph deep crawler, live global weather, and timezone clocks.
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
            onClick={() => setActiveSubTab('sse')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'sse' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>⚡ MCP SSE Transport</span>
            {sseStatus === 'connected' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
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
            Direct POST Tester
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

      {/* Sub-tab: MCP SSE Transport */}
      {activeSubTab === 'sse' && (
        <div className="space-y-6">
          {/* SSE Connection & Status Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Official MCP SSE Protocol (2024-11-05 Spec)</span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    GET /sse + POST /messages
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1.5">
                  Server-Sent Events (SSE) Live Transport
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
                  Connect remote and local LLM clients (Claude Desktop, Cursor, Continue, autonomous agents) over persistent HTTP SSE.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {sseStatus === 'connected' ? (
                  <button
                    onClick={disconnectSse}
                    className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono font-medium flex items-center gap-2 transition-colors"
                  >
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Disconnect Stream</span>
                  </button>
                ) : (
                  <button
                    onClick={connectSse}
                    disabled={sseStatus === 'connecting'}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-mono font-medium flex items-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
                  >
                    {sseStatus === 'connecting' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wifi className="w-3.5 h-3.5" />
                    )}
                    <span>{sseStatus === 'connecting' ? 'Connecting...' : 'Connect to /sse'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Connection Status Details Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 font-mono text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Connection:</span>
                <span className="flex items-center gap-1.5 font-bold">
                  {sseStatus === 'connected' && (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-400">CONNECTED</span>
                    </>
                  )}
                  {sseStatus === 'connecting' && (
                    <>
                      <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                      <span className="text-cyan-400">CONNECTING...</span>
                    </>
                  )}
                  {sseStatus === 'disconnected' && (
                    <>
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                      <span className="text-slate-400">DISCONNECTED</span>
                    </>
                  )}
                  {sseStatus === 'error' && (
                    <>
                      <AlertCircle className="w-3 h-3 text-red-400" />
                      <span className="text-red-400">ERROR / CLOSED</span>
                    </>
                  )}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">SSE Endpoint:</span>
                <span className="text-cyan-300 truncate max-w-[180px]" title={discoveredEndpoint || 'None yet'}>
                  {discoveredEndpoint || '/sse'}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Session ID:</span>
                <span className="text-indigo-400 truncate max-w-[180px]" title={activeSessionId || 'None'}>
                  {activeSessionId ? `${activeSessionId.substring(0, 14)}...` : 'Not active'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Request & Live Event Stream Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Request Sender */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-mono font-bold text-slate-200">
                    POST JSON-RPC TO /messages
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  HTTP 202 Accepted
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  1-Click Test Presets:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handlePreset('initialize')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left text-xs font-mono text-slate-300 transition-colors"
                  >
                    ⚡ initialize
                  </button>
                  <button
                    onClick={() => handlePreset('tools/list')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left text-xs font-mono text-slate-300 transition-colors"
                  >
                    🛠️ tools/list
                  </button>
                  <button
                    onClick={() => handlePreset('web_search')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left text-xs font-mono text-cyan-300 transition-colors"
                  >
                    🔍 Web Search
                  </button>
                  <button
                    onClick={() => handlePreset('weather')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left text-xs font-mono text-amber-300 transition-colors"
                  >
                    ☀️ get_weather
                  </button>
                  <button
                    onClick={() => handlePreset('time')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left text-xs font-mono text-emerald-300 transition-colors"
                  >
                    ⏱️ get_time
                  </button>
                </div>
              </div>

              {/* Payload Editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono text-slate-400">JSON-RPC Request Body:</label>
                  <span className="text-[10px] font-mono text-slate-500">sessionId automatically appended</span>
                </div>
                <textarea
                  value={ssePostPayload}
                  onChange={(e) => setSsePostPayload(e.target.value)}
                  rows={9}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-indigo-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => handleSendSsePost()}
                  disabled={isSendingSsePost || !activeSessionId}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-mono font-medium flex items-center gap-2 transition-colors shadow-md shadow-indigo-600/30"
                >
                  {isSendingSsePost ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Send to /messages</span>
                </button>

                {!activeSessionId && (
                  <span className="text-xs font-mono text-amber-400">
                    ⚠️ Click "Connect to /sse" first
                  </span>
                )}
              </div>

              {postStatusMessage && (
                <div className={`p-3 rounded-lg text-xs font-mono ${
                  postStatusMessage.startsWith('✓')
                    ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-300'
                    : 'bg-red-950/40 border border-red-800/40 text-red-300'
                }`}>
                  {postStatusMessage}
                </div>
              )}
            </div>

            {/* Right: Live SSE Stream Log */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-[520px]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-bold text-slate-200">
                    LIVE SSE EVENT STREAM
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">
                    {sseEvents.length} events
                  </span>
                  {sseEvents.length > 0 && (
                    <button
                      onClick={() => setSseEvents([])}
                      className="text-[11px] font-mono text-slate-500 hover:text-slate-300 underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 bg-slate-950 rounded-lg p-3 font-mono text-xs overflow-y-auto space-y-2.5 border border-slate-800/80">
                {sseEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center p-6 space-y-2">
                    <Radio className="w-8 h-8 text-slate-700" />
                    <div>No SSE events received yet.</div>
                    <div className="text-[11px] text-slate-500 max-w-xs">
                      Click <strong>"Connect to /sse"</strong> to initiate the stream, then trigger presets to see live JSON-RPC answers!
                    </div>
                  </div>
                ) : (
                  sseEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className={`p-2.5 rounded-lg border text-left space-y-1 ${
                        evt.type === 'endpoint'
                          ? 'bg-cyan-950/30 border-cyan-800/40 text-cyan-300'
                          : evt.type === 'message'
                          ? 'bg-indigo-950/40 border-indigo-800/50 text-slate-200'
                          : evt.type === 'connection'
                          ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900/80">
                          event: {evt.type}
                        </span>
                        <span>{evt.time}</span>
                      </div>

                      {evt.type === 'message' && evt.raw ? (
                        <div className="space-y-1.5 mt-1">
                          {evt.raw.result?.content?.[0]?.text && (
                            <pre className="p-2 bg-slate-900/90 rounded border border-slate-800/80 text-[11px] text-emerald-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                              {evt.raw.result.content[0].text}
                            </pre>
                          )}
                          <details className="text-[10px] text-slate-400 cursor-pointer">
                            <summary className="hover:text-slate-200">Show raw JSON-RPC response</summary>
                            <pre className="mt-1 p-2 bg-slate-900/90 rounded text-[10px] text-slate-300 overflow-x-auto">
                              {JSON.stringify(evt.raw, null, 2)}
                            </pre>
                          </details>
                        </div>
                      ) : (
                        <pre className="text-[11px] font-mono break-all whitespace-pre-wrap">
                          {evt.data}
                        </pre>
                      )}
                    </div>
                  ))
                )}
                <div ref={eventsEndRef} />
              </div>
            </div>
          </div>

          {/* Configuration Snippets */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-white">
                How to Connect Claude Desktop & Cursor with MCP SSE
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure your AI tools to connect directly to this running server using the standard MCP SSE URL.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Local SSE Config */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    1. Local Host (Port 3000)
                  </span>
                  <button
                    onClick={() =>
                      copyText(
                        JSON.stringify(
                          {
                            mcpServers: {
                              'crawler-search': {
                                url: 'http://localhost:3000/sse',
                              },
                            },
                          },
                          null,
                          2
                        ),
                        'local-sse'
                      )
                    }
                    className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copied === 'local-sse' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied === 'local-sse' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-indigo-300 overflow-x-auto border border-slate-800">
{`{
  "mcpServers": {
    "crawler-search": {
      "url": "http://localhost:3000/sse"
    }
  }
}`}
                </pre>
              </div>

              {/* Vercel / Cloud SSE Config */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    2. Remote / Vercel Cloud Deployment
                  </span>
                  <button
                    onClick={() =>
                      copyText(
                        JSON.stringify(
                          {
                            mcpServers: {
                              'crawler-search': {
                                url: 'https://your-domain.vercel.app/api/mcp/sse',
                              },
                            },
                          },
                          null,
                          2
                        ),
                        'remote-sse'
                      )
                    }
                    className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copied === 'remote-sse' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied === 'remote-sse' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800">
{`{
  "mcpServers": {
    "crawler-search": {
      "url": "https://your-project.vercel.app/api/mcp/sse"
    }
  }
}`}
                </pre>
              </div>
            </div>

            {/* Curl Command Example */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-mono font-bold text-slate-300">
                Curl Testing Specification (2 Steps):
              </div>
              <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800">
{`# Step 1: Open persistent SSE stream (returns event: endpoint\\ndata: /messages?sessionId=...)
curl -N http://localhost:3000/sse

# Step 2: Post JSON-RPC message using the sessionId from Step 1
curl -X POST "http://localhost:3000/messages?sessionId=<SESSION_ID>" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"Web Search","arguments":{"query":"toyota vios 2026","num":3}}}'`}
              </pre>
            </div>
          </div>
        </div>
      )}

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
