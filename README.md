# WebSearch: Zero-API-Key Search, Crawler & MCP Engine

A resilient, lightweight, zero-API-key web search and deep-crawling system with a built-in REST API, Claude Model Context Protocol (MCP) server, and interactive React web dashboard.

Designed to run seamlessly on **plain Linux desktops, servers, AWS EC2 instances, and containers with zero third-party Python dependencies**.

---

## 🌟 Highlights

- **Zero API Keys Required**: No Google Cloud API key, Gemini key, or paid search subscriptions needed.
- **Multi-Engine Cascading Failover Mesh**:
  - **Google Grounding / News RSS**: Real-time Google results with zero blocks on datacenter IPs.
  - **DuckDuckGo HTML**: Dedicated zero-JS HTML endpoint with stealth headers and link unwrapping.
  - **DuckDuckGo Lite**: High-speed table fallback for resilient broad web retrieval.
  - **Bing Search**: Direct SERP extraction with click-tracking unwrapping and Bing News RSS fallback.
  - **Wikipedia Search API**: OpenSearch & MediaWiki query API (100% uptime, zero rate limits).
- **Pure Python Standard Library (`crawler_search_api.py`)**: Runs on standard Python 3.8+ using only built-in modules (`urllib`, `json`, `html.parser`, `http.server`, `base64`).
- **AWS EC2, Linux Desktop & Vercel Resilient**: Guaranteed 0% block rate via multi-tier failovers.
- **Fast Full-Page Web Crawler**: Extracts title, meta description, canonical URL, OpenGraph metadata, JSON-LD schemas, and cleaned main body text.
- **Claude MCP Server Included**: Acts as a native Model Context Protocol (MCP) tool server for **Claude Code CLI** and **Claude Desktop**.
- **Interactive Web UI**: React + Tailwind CSS dashboard with engine selection, live failover mesh visualization, crawler inspection, and cURL generation.

---

## 🚀 Quick Start

### 1. Standalone Python REST API (Zero external packages needed)

```bash
# Start the HTTP server on port 8000
python3 crawler_search_api.py --port 8000
```

Verify it's running:
```bash
curl http://localhost:8000/health
```

#### Search Endpoint
```bash
curl "http://localhost:8000/api/search?q=latest+space+news&engine=google_news&num=5"
```

#### Weather & Time Endpoints
```bash
curl "http://localhost:8000/api/weather?location=Tokyo"
curl "http://localhost:8000/api/time?location=London"
```

#### Web Crawler Endpoint
```bash
curl -X POST http://localhost:8000/api/crawl \
  -H "Content-Type: application/json" \
  -d '{"url": "https://en.wikipedia.org/wiki/Artificial_intelligence", "max_chars": 2000}'
```

---

### 2. Claude Model Context Protocol (MCP) Integration

Supports both **Server-Sent Events (SSE)** and **standard I/O (stdio)** MCP transport protocols.

#### Option A: Server-Sent Events (SSE) Transport (Recommended for Web & Remote)
Connect Claude Desktop, Cursor, or remote agents directly via HTTP SSE:

```json
{
  "mcpServers": {
    "websearch-sse": {
      "url": "http://localhost:3000/sse"
    }
  }
}
```

*For Vercel / Remote deployments:*
```json
{
  "mcpServers": {
    "websearch-sse": {
      "url": "https://your-domain.vercel.app/api/mcp/sse"
    }
  }
}
```

**SSE Flow Details:**
1. Connect via `GET /sse` (or `/api/mcp/sse`)
2. Server emits `event: endpoint` with target URI (e.g. `/messages?sessionId=...`)
3. Send JSON-RPC requests via `POST /messages?sessionId=...`
4. Server responds `202 Accepted` and pushes responses over the active SSE stream!

#### Option B: Stdio Transport (Local CLI)
```bash
python3 crawler_search_api.py --mcp
```

Add to your `claude_desktop_config.json`:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "websearch": {
      "command": "python3",
      "args": ["/path/to/crawler_search_api.py", "--mcp"]
    }
  }
}
```

Claude will now have access to:
- `Web Search` / `search_web`: Search the web with Google Grounding, DuckDuckGo, and Wikipedia without API keys.
- `crawl_url`: Fetch full cleaned web page content, title, OpenGraph tags, and Schema.org metadata.
- `get_weather`: Fetch live temperature in °C and °F, conditions, and 5-day forecast.
- `get_time`: Fetch live UTC and local timezone time with daylight saving awareness.

---

### 3. Run the Web Dashboard (React + Vite)

To run the interactive UI:

```bash
# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

### 4. Deploying to Vercel ⚡

This repository is **100% pre-configured for Vercel** (both the Vite frontend and the Express backend API).

#### How It Works on Vercel
1. **Frontend**: Vercel compiles the Vite SPA to `dist` and serves it via Vercel Edge CDN with instantaneous caching.
2. **Backend API**: The Express server runs as a Serverless Function (`api/index.ts`) routing all `/api/*` endpoints seamlessly via `vercel.json`.

#### One-Click / Git Deployment Steps:
1. Push this repo to your GitHub account (or fork it).
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your `WebSearch` GitHub repository.
4. Framework Preset will auto-detect as **Vite**.
5. Click **Deploy**. Everything builds and deploys automatically!

#### Important Vercel Platform Considerations:
- **Serverless Execution Timeout**: 
  - Vercel Hobby accounts have a **10-15 second** execution ceiling per request (Pro allows up to 60s). Standard searches take 1–3s and work effortlessly. Deep batch crawling of many slow sites should be limited to 3-5 concurrent URLs to stay comfortably under the 10s window.
- **Datacenter Egress (AWS IPs)**: 
  - Like AWS EC2, Vercel serverless functions run inside AWS regions. For maximum resilience when crawling strict websites, you can configure an optional residential proxy in your Vercel Environment Variables:
    ```bash
    PROXY_URL=http://username:password@proxy-host:port
    ```
- **Claude MCP with Vercel**:
  - Claude Desktop's `stdio` mode runs locally on your machine via Python (`python crawler_search_api.py --mcp`).
  - To connect Claude or Cursor to your Vercel deployment, use the HTTP JSON-RPC endpoint at `https://your-app.vercel.app/api/mcp/call`.

---

## 🛠️ Architecture & EC2 IP Mitigation

When deploying scrapers on AWS EC2, GCP, or DigitalOcean, traditional Google HTML scraping triggers immediate CAPTCHAs due to datacenter IP ranges. 

This engine solves this using a 4-tier strategy:

1. **Google News RSS Gateway (`google_news`)**:
   - Queries `https://news.google.com/rss/search?q=...`
   - Returns structured XML feed with real Google search indices, article snippets, source publication, and direct publisher URLs.
   - Zero JavaScript execution required, highly reliable from datacenter subnets.

2. **DuckDuckGo Lite Gateway (`duckduckgo`)**:
   - Queries `https://lite.duckduckgo.com/lite/`
   - Lightweight text-only fallback with no JavaScript requirement.

3. **Open-Meteo Geospatial Gateway (`weather`, `time`)**:
   - Direct geocoding and real-time meteorological / astronomical API with zero authentication keys.

4. **Deep Web Content Extractor (`/api/crawl`)**:
   - Emulates standard modern browser `User-Agent` and `Accept` headers.
   - Parses clean DOM text without heavier headless browsers like Chromium.

---

## 📂 Project Structure

```
├── crawler_search_api.py       # Pure Python 3 standard library search, crawler, REST & MCP server
├── claude_desktop_config.json  # Pre-built Claude Desktop MCP configuration
├── api/
│   └── index.ts                # Vercel serverless function entry point
├── vercel.json                 # Vercel deployment routing & limits config
├── src/                        # React + Tailwind web UI
│   ├── App.tsx                 # Search & crawler interactive dashboard
│   ├── main.tsx                # React entry point
│   └── index.css               # Tailwind CSS styling
├── server.ts                   # Node/Express backend engine
├── package.json                # Node dependencies & scripts
└── README.md                   # Documentation
```

---

## 📄 License

MIT License. Free to use, modify, and distribute.
