/**
 * Full-Stack Express Server for Google Search & Web Crawler API
 * Mounts Vite dev middleware in dev, serves static build in production.
 * Listens on port 3000.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { searchEngine } from './server/searchEngine.ts';
import { crawlerEngine } from './server/crawlerEngine.ts';
import { robotsParser } from './server/robotsParser.ts';
import { globalRateLimiter } from './server/rateLimiter.ts';
import { weatherTimeService } from './server/weatherTimeService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Enable CORS for API consumers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Normalize request URLs so endpoints match with or without '/api' prefix (common in serverless rewrites)
app.use((req, res, next) => {
  if (
    !req.url.startsWith('/api') &&
    (req.url.startsWith('/search') ||
      req.url.startsWith('/crawl') ||
      req.url.startsWith('/robots-check') ||
      req.url.startsWith('/weather') ||
      req.url.startsWith('/time') ||
      req.url.startsWith('/status') ||
      req.url.startsWith('/mcp'))
  ) {
    req.url = '/api' + req.url;
  }
  next();
});

// --- API Endpoints ---

/**
 * POST /api/search
 * Search Google with zero anti-scraping blocks, extracting rich page metadata for each result.
 */
app.post('/api/search', async (req: Request, res: Response) => {
  try {
    const { query, num, crawlMetadata, respectRobots, concurrency, timeoutMs } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Search query parameter "query" is required' });
    }

    const searchResponse = await searchEngine.searchAndCrawl(query.trim(), {
      num: typeof num === 'number' ? num : 8,
      crawlMetadata: crawlMetadata !== false,
      respectRobots: respectRobots !== false,
      concurrency: typeof concurrency === 'number' ? concurrency : 4,
      timeoutMs: typeof timeoutMs === 'number' ? timeoutMs : 10000,
    });

    res.json(searchResponse);
  } catch (err: any) {
    console.error('Error in /api/search:', err);
    res.status(500).json({ error: err.message || 'Internal server error during search and crawl' });
  }
});

/**
 * POST /api/crawl
 * Deep crawl a single target URL and extract OpenGraph, Twitter, JSON-LD schema, headings & metrics.
 */
app.post('/api/crawl', async (req: Request, res: Response) => {
  try {
    const { url, respectRobots, timeoutMs, customHeaders, customDelayMs } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Parameter "url" is required' });
    }

    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL provided. Please provide a full URL with http:// or https://' });
    }

    const metadata = await crawlerEngine.crawlUrl(url, {
      respectRobots: respectRobots !== false,
      timeoutMs: typeof timeoutMs === 'number' ? timeoutMs : 12000,
      customHeaders,
      customDelayMs,
    });

    res.json(metadata);
  } catch (err: any) {
    console.error('Error in /api/crawl:', err);
    res.status(err.message.includes('disallowed by robots.txt') ? 403 : 502).json({
      error: err.message || 'Failed to crawl target URL',
    });
  }
});

/**
 * POST /api/crawl/batch
 * Crawl multiple URLs concurrently with automatic domain rate-limiting and backoff.
 */
app.post('/api/crawl/batch', async (req: Request, res: Response) => {
  try {
    const { urls, concurrency = 4, respectRobots = true, timeoutMs = 10000 } = req.body;

    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'Array of "urls" is required' });
    }

    const maxItems = Math.min(urls.length, 25);
    const targetUrls = urls.slice(0, maxItems);
    const startTime = Date.now();

    const results: Array<{ url: string; success: boolean; data?: any; error?: string }> = new Array(targetUrls.length);
    let index = 0;

    const worker = async () => {
      while (index < targetUrls.length) {
        const i = index++;
        const currentUrl = targetUrls[i];
        try {
          const data = await crawlerEngine.crawlUrl(currentUrl, {
            respectRobots,
            timeoutMs,
          });
          results[i] = { url: currentUrl, success: true, data };
        } catch (err: any) {
          results[i] = { url: currentUrl, success: false, error: err.message || 'Crawl failed' };
        }
      }
    };

    const pool = Array.from({ length: Math.min(concurrency, 6) }, () => worker());
    await Promise.all(pool);

    res.json({
      total: targetUrls.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      executionTimeMs: Date.now() - startTime,
      results,
    });
  } catch (err: any) {
    console.error('Error in /api/crawl/batch:', err);
    res.status(500).json({ error: err.message || 'Batch crawl failed' });
  }
});

/**
 * GET /api/robots-check
 * Inspect robots.txt rules for any target URL or domain.
 */
app.get('/api/robots-check', async (req: Request, res: Response) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: 'Query parameter "url" is required' });
    }

    const check = await robotsParser.isAllowed(targetUrl);
    const domainData = await robotsParser.getRobots(targetUrl);

    res.json({
      url: targetUrl,
      allowed: check.allowed,
      reason: check.reason,
      crawlDelay: check.crawlDelay,
      domainData: {
        totalRules: domainData.rules.length,
        rules: domainData.rules,
        rawSample: domainData.rawText,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error checking robots.txt' });
  }
});
/**
 * GET /api/weather
 * Retrieve live meteorological conditions and 5-day forecast for any location.
 */
app.get('/api/weather', async (req: Request, res: Response) => {
  try {
    const location = (req.query.location as string) || 'Tokyo';
    const weather = await weatherTimeService.getWeather(location);
    res.json(weather);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch weather data' });
  }
});

/**
 * GET /api/time
 * Retrieve live timezone-aware time, UTC offset, and date for any location or timezone.
 */
app.get('/api/time', async (req: Request, res: Response) => {
  try {
    const location = (req.query.location as string) || (req.query.timezone as string) || 'UTC';
    const time = await weatherTimeService.getTime(location);
    res.json(time);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch time data' });
  }
});

/**
 * GET /api/status
 * Crawler engine health, rate-limiter telemetry, and active queue inspection.
 */
app.get('/api/status', (req: Request, res: Response) => {
  const stats = globalRateLimiter.getStats();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    engine: {
      searchEngine: 'Google Search via Grounding API',
      crawlerEngine: 'Cheerio + Stealth Fingerprint + Token Bucket',
      rateLimiter: stats,
    },
  });
});

/**
 * GET /api/docs
 * OpenAPI-compatible API documentation spec.
 */
app.get('/api/docs', (req: Request, res: Response) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'Google Search & Resilient Web Crawler API',
      version: '1.0.0',
      description:
        'High-performance Node.js & Python compatible Web Crawler & Google Search API with anti-rate-limiting, stealth headers, and OpenGraph metadata extraction.',
    },
    paths: {
      '/api/search': {
        post: {
          summary: 'Search Google and crawl page metadata for each result',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', example: 'Next.js vs Vite performance' },
                    num: { type: 'integer', default: 8, example: 5 },
                    crawlMetadata: { type: 'boolean', default: true },
                    respectRobots: { type: 'boolean', default: true },
                    concurrency: { type: 'integer', default: 4 },
                    timeoutMs: { type: 'integer', default: 10000 },
                  },
                  required: ['query'],
                },
              },
            },
          },
        },
      },
      '/api/crawl': {
        post: {
          summary: 'Deep crawl a single web page and extract all metadata',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    url: { type: 'string', example: 'https://github.com' },
                    respectRobots: { type: 'boolean', default: true },
                    timeoutMs: { type: 'integer', default: 12000 },
                  },
                  required: ['url'],
                },
              },
            },
          },
        },
      },
      '/api/crawl/batch': {
        post: {
          summary: 'Batch crawl multiple URLs with concurrency throttling',
        },
      },
      '/api/weather': {
        get: {
          summary: 'Retrieve live meteorological conditions and 5-day forecast',
          parameters: [{ name: 'location', in: 'query', schema: { type: 'string', default: 'Tokyo' } }],
        },
      },
      '/api/time': {
        get: {
          summary: 'Retrieve live timezone-aware time, UTC offset, and date',
          parameters: [{ name: 'location', in: 'query', schema: { type: 'string', default: 'London' } }],
        },
      },
      '/mcp': {
        post: {
          summary: 'Model Context Protocol (MCP) JSON-RPC 2.0 endpoint for AI Agents',
        },
      },
      '/api/status': {
        get: {
          summary: 'Retrieve live crawler health and rate-limiter stats',
        },
      },
    },
  });
});

app.get('/openapi.json', (req: Request, res: Response) => {
  res.redirect('/api/docs');
});

/**
 * GET /docs & GET /swagger
 * Interactive Swagger UI for testing all API endpoints (No auth needed)
 */
app.get(['/docs', '/swagger'], (req: Request, res: Response) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CrawlerSearch API - Interactive Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body { margin: 0; background: #0b0f19; font-family: sans-serif; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui { color: #f1f5f9; }
    .swagger-ui .info .title { color: #818cf8; }
    .swagger-ui .scheme-container { background: #1e293b; box-shadow: none; border-bottom: 1px solid #334155; }
    .swagger-ui .opblock { background: #1e293b; border-color: #334155; }
    .swagger-ui .opblock .opblock-summary-method { border-radius: 6px; }
    .swagger-ui section.models { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "/api/docs",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`);
});

/**
 * POST /mcp
 * Model Context Protocol (MCP) JSON-RPC 2.0 endpoint
 */
app.post('/mcp', async (req: Request, res: Response) => {
  const { method, id, params } = req.body || {};

  if (method === 'initialize') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'crawler-search-mcp', version: '1.0.0' },
      },
    });
  }

  if (method === 'tools/list') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: 'Web Search',
            description: 'Searches Google and the web in real-time, returning ranked results with rich page metadata, OpenGraph cards, schema.org data, and instant weather/time answers without getting blocked by rate limits.',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'The search query to look up on the web' },
                num: { type: 'integer', default: 5, description: 'Number of results to retrieve' },
              },
              required: ['query'],
            },
          },
          {
            name: 'search_web',
            description: 'Alias for Web Search.',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'The search query' },
                num: { type: 'integer', default: 5, description: 'Number of results' },
              },
              required: ['query'],
            },
          },
          {
            name: 'crawl_url',
            description: 'Deeply crawl any URL and extract page metadata, OpenGraph tags, and Schema.org structured data.',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string', description: 'Target URL to crawl' },
              },
              required: ['url'],
            },
          },
          {
            name: 'get_weather',
            description: 'Get real-time weather conditions, temperature in °C and °F, and 5-day forecast for any global location.',
            inputSchema: {
              type: 'object',
              properties: {
                location: { type: 'string', description: 'City name (e.g. Tokyo, London)' },
              },
              required: ['location'],
            },
          },
          {
            name: 'get_time',
            description: 'Get live timezone-aware exact local time, date, and UTC offset.',
            inputSchema: {
              type: 'object',
              properties: {
                location: { type: 'string', description: 'City or timezone' },
              },
              required: ['location'],
            },
          },
        ],
      },
    });
  }

  if (method === 'tools/call') {
    const toolName = params?.name;
    const args = params?.arguments || {};

    try {
      if (toolName === 'Web Search' || toolName === 'search_web' || toolName === 'web_search') {
        const query = args.query || args.search_term || args.q || '';
        const num = args.num || args.limit || 5;
        const result = await searchEngine.searchAndCrawl(query, { num });

        let markdown = `# Web Search Results for: "${query}"\n\n`;
        if (result.instantAnswer?.type === 'weather' && result.instantAnswer.weather) {
          const w = result.instantAnswer.weather;
          markdown += `**Instant Weather for ${w.location}:** ${w.current.temperatureC}°C (${w.current.temperatureF}°F), ${w.current.condition}, Humidity: ${w.current.humidityPercent}%\n\n`;
        }
        if (result.instantAnswer?.type === 'time' && result.instantAnswer.time) {
          const t = result.instantAnswer.time;
          markdown += `**Instant Time for ${t.location}:** ${t.time12h} (${t.timezone}, ${t.utcOffset})\n\n`;
        }
        for (const item of result.results) {
          markdown += `### ${item.rank}. [${item.title}](${item.url})\n`;
          markdown += `**URL:** ${item.url}\n`;
          markdown += `${item.snippet}\n`;
          if (item.metadata?.openGraph?.image) {
            markdown += `> **Preview Image:** ${item.metadata.openGraph.image}\n`;
          }
          if (item.metadata?.contentMetrics?.wordCount) {
            markdown += `*Page Length: ${item.metadata.contentMetrics.wordCount.toLocaleString()} words*\n`;
          }
          markdown += `\n`;
        }

        return res.json({
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: markdown }] },
        });
      }

      if (toolName === 'crawl_url') {
        const result = await crawlerEngine.crawlUrl(args.url);
        return res.json({
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] },
        });
      }

      if (toolName === 'get_weather') {
        const result = await weatherTimeService.getWeather(args.location || 'Tokyo');
        return res.json({
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] },
        });
      }

      if (toolName === 'get_time') {
        const result = await weatherTimeService.getTime(args.location || 'UTC');
        return res.json({
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] },
        });
      }

      return res.status(404).json({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Tool '${toolName}' not found` },
      });
    } catch (err: any) {
      return res.status(500).json({
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: err.message },
      });
    }
  }

  res.status(400).json({ jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid JSON-RPC request' } });
});

// Export express app for serverless platforms (Vercel, AWS Lambda, Netlify)
export { app };
export default app;

// --- Development Vite Middlewares or Production Static Serving ---
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

// Only start the standalone HTTP listener if not running in a serverless environment like Vercel
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  });
}

