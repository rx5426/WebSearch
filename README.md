# WebSearch: Zero-API-Key Search, Crawler & MCP Engine

A resilient, lightweight, zero-API-key web search and deep-crawling system with a built-in REST API, Claude Model Context Protocol (MCP) server, and interactive React web dashboard.

Designed to run seamlessly on **plain Linux desktops, servers, AWS EC2 instances, and containers with zero third-party Python dependencies**.

---

## 🌟 Highlights

- **Zero API Keys Required**: No Google Cloud API key, Gemini key, or paid search subscriptions needed.
- **Pure Python Standard Library (`crawler_search_api.py`)**: Runs on standard Python 3.8+ using only built-in modules (`urllib`, `json`, `html.parser`, `http.server`).
- **AWS EC2 & Datacenter IP Resilient**:
  - Uses Google News RSS XML endpoints (which do not require JavaScript or trigger CAPTCHAs).
  - DuckDuckGo Lite fallback engine.
  - Open-Meteo live weather and local time API (public, zero-key, high rate limit).
- **Fast Full-Page Web Crawler**:
  - Extracts title, meta description, canonical URL, OpenGraph metadata, JSON-LD schemas, and cleaned main body text.
  - Respects character limits and strips scripts/styles.
- **Claude MCP Server Included**:
  - Acts as a native Model Context Protocol (MCP) tool server for **Claude Code CLI** and **Claude Desktop**.
- **Interactive Web UI**:
  - React + Tailwind CSS dashboard for live testing, crawler inspection, cURL code generation, and MCP configuration.

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

You can integrate this directly as a search & crawl tool for **Claude Desktop** or **Claude Code**.

#### Run as MCP stdio server:
```bash
python3 crawler_search_api.py --mcp
```

#### Add to Claude Desktop Configuration
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
- `search_web`: Search the web (Google News RSS or DuckDuckGo) without API keys.
- `crawl_url`: Fetch full cleaned web page content, title, and OpenGraph metadata.
- `get_weather`: Fetch live temperature, conditions, and wind speed.
- `get_time`: Fetch live UTC and local timezone time.

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
├── src/                        # React + Tailwind web UI
│   ├── App.tsx                 # Search & crawler interactive dashboard
│   ├── main.tsx                # React entry point
│   └── index.css               # Tailwind CSS styling
├── server.ts                   # Node/Express backend bridge
├── package.json                # Node dependencies & scripts
└── README.md                   # Documentation
```

---

## 📄 License

MIT License. Free to use, modify, and distribute.
