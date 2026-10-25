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
 * GET /api/search
 * Search Google & resilient failover mesh (DuckDuckGo, Bing, Wikipedia) with rich page metadata via GET query parameters.
 */
app.get('/api/search', async (req: Request, res: Response) => {
  try {
    const rawQuery = (req.query.query || req.query.q || req.query.search) as string;

    if (!rawQuery || typeof rawQuery !== 'string' || !rawQuery.trim()) {
      return res.status(400).json({ error: 'Search query parameter "query" or "q" is required (e.g. /api/search?q=swagger)' });
    }

    const num = req.query.num ? parseInt(req.query.num as string, 10) : 8;
    const crawlMetadata = req.query.crawlMetadata !== 'false';
    const respectRobots = req.query.respectRobots !== 'false';
    const concurrency = req.query.concurrency ? parseInt(req.query.concurrency as string, 10) : 4;
    const timeoutMs = req.query.timeoutMs ? parseInt(req.query.timeoutMs as string, 10) : 10000;
    const engine = req.query.engine as any;

    const searchResponse = await searchEngine.searchAndCrawl(rawQuery.trim(), {
      num: isNaN(num) ? 8 : Math.max(1, Math.min(num, 30)),
      crawlMetadata,
      respectRobots,
      concurrency: isNaN(concurrency) ? 4 : Math.max(1, Math.min(concurrency, 8)),
      timeoutMs: isNaN(timeoutMs) ? 10000 : timeoutMs,
      engine,
    });

    res.json(searchResponse);
  } catch (err: any) {
    console.error('Error in GET /api/search:', err);
    res.status(500).json({ error: err.message || 'Internal server error during search and crawl' });
  }
});

/**
 * POST /api/search
 * Search Google with zero anti-scraping blocks, extracting rich page metadata for each result.
 */
app.post('/api/search', async (req: Request, res: Response) => {
  try {
    const { query, q, num, crawlMetadata, respectRobots, concurrency, timeoutMs, engine } = req.body || {};
    const searchQuery = (query || q || '') as string;

    if (!searchQuery || typeof searchQuery !== 'string' || !searchQuery.trim()) {
      return res.status(400).json({ error: 'Search query parameter "query" or "q" is required' });
    }

    const searchResponse = await searchEngine.searchAndCrawl(searchQuery.trim(), {
      num: typeof num === 'number' ? Math.max(1, Math.min(num, 30)) : 8,
      crawlMetadata: crawlMetadata !== false,
      respectRobots: respectRobots !== false,
      concurrency: typeof concurrency === 'number' ? Math.max(1, Math.min(concurrency, 8)) : 4,
      timeoutMs: typeof timeoutMs === 'number' ? timeoutMs : 10000,
      engine,
    });

    res.json(searchResponse);
  } catch (err: any) {
    console.error('Error in POST /api/search:', err);
    res.status(500).json({ error: err.message || 'Internal server error during search and crawl' });
  }
});

/**
 * GET /api/crawl
 * Deep crawl a single target URL via GET parameter (convenient for browsers, curl, and Swagger UI).
 */
app.get('/api/crawl', async (req: Request, res: Response) => {
  try {
    const targetUrl = (req.query.url || req.query.target) as string;

    if (!targetUrl || typeof targetUrl !== 'string') {
      return res.status(400).json({ error: 'Parameter "url" is required (e.g. /api/crawl?url=https://swagger.io)' });
    }

    try {
      new URL(targetUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid URL provided. Please provide a full URL with http:// or https://' });
    }

    const respectRobots = req.query.respectRobots !== 'false';
    const timeoutMs = req.query.timeoutMs ? parseInt(req.query.timeoutMs as string, 10) : 12000;

    const metadata = await crawlerEngine.crawlUrl(targetUrl, {
      respectRobots,
      timeoutMs: isNaN(timeoutMs) ? 12000 : timeoutMs,
    });

    res.json(metadata);
  } catch (err: any) {
    console.error('Error in GET /api/crawl:', err);
    res.status(err.message?.includes('disallowed by robots.txt') ? 403 : 502).json({
      error: err.message || 'Failed to crawl target URL',
    });
  }
});

/**
 * POST /api/crawl
 * Deep crawl a single target URL and extract OpenGraph, Twitter, JSON-LD schema, headings & metrics.
 */
app.post('/api/crawl', async (req: Request, res: Response) => {
  try {
    const { url, respectRobots, timeoutMs, customHeaders, customDelayMs } = req.body || {};

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

const openApiSpecification = {
  openapi: '3.0.3',
  info: {
    title: 'Google Search & Resilient Web Crawler API',
    version: '1.0.0',
    description:
      'High-performance Node.js & Python compatible Web Crawler, Google Search API, Weather, and Time Service with Multi-Tier Failover (Google Grounding, DuckDuckGo HTML, DuckDuckGo Lite, Bing, Wikipedia). Zero bot blocks, live metadata extraction, and instant answers.',
    contact: {
      name: 'CrawlerSearch Support',
      url: 'https://github.com/rx5426/WebSearch',
    },
  },
  servers: [
    {
      url: '/',
      description: 'Default Server (Auto-detect Host)',
    },
  ],
  tags: [
    { name: 'Search', description: 'Web Search & Multi-Engine Failover Mesh' },
    { name: 'Crawler', description: 'Deep Web Page Crawling & OpenGraph Extraction' },
    { name: 'Instant Answers', description: 'Real-time Weather & Timezone-aware Clock' },
    { name: 'System', description: 'Crawler Engine Telemetry & MCP Protocol' },
  ],
  paths: {
    '/api/search': {
      get: {
        tags: ['Search'],
        summary: 'Search Google & Web Failover Mesh via GET query',
        description: 'Execute searches with query parameters. Automatically tries Google Search Grounding -> DuckDuckGo HTML -> DuckDuckGo Lite -> Bing -> Wikipedia without rate limits.',
        parameters: [
          {
            name: 'q',
            in: 'query',
            description: 'Search query string (e.g. "swagger", "toyota vios 2026", "weather in tokyo")',
            required: false,
            schema: { type: 'string', example: 'swagger' },
          },
          {
            name: 'query',
            in: 'query',
            description: 'Alternative alias for query parameter',
            required: false,
            schema: { type: 'string', example: 'swagger' },
          },
          {
            name: 'num',
            in: 'query',
            description: 'Number of results to retrieve (1-30)',
            schema: { type: 'integer', default: 8, example: 5 },
          },
          {
            name: 'engine',
            in: 'query',
            description: 'Target search engine or auto failover',
            schema: {
              type: 'string',
              enum: ['auto', 'duckduckgo-html', 'bing', 'wikipedia', 'duckduckgo-lite', 'google'],
              default: 'auto',
            },
          },
          {
            name: 'crawlMetadata',
            in: 'query',
            description: 'Concurrently crawl result URLs to extract rich metadata',
            schema: { type: 'boolean', default: true },
          },
        ],
        responses: {
          '200': {
            description: 'Successful search results with extracted page metadata',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', example: 'swagger' },
                    totalResults: { type: 'integer', example: 8 },
                    executionTimeMs: { type: 'integer', example: 1240 },
                    engine: { type: 'string', example: 'duckduckgo-html' },
                    failoverTrail: { type: 'array', items: { type: 'string' } },
                    results: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          rank: { type: 'integer', example: 1 },
                          title: { type: 'string', example: 'API Documentation & Design Tools for Teams | Swagger' },
                          url: { type: 'string', example: 'https://swagger.io/' },
                          snippet: { type: 'string' },
                          sourceEngine: { type: 'string', example: 'duckduckgo-html' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Missing query parameter',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
          '500': {
            description: 'Internal server error',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
      post: {
        tags: ['Search'],
        summary: 'Search Google & Web Failover Mesh via JSON POST',
        description: 'Execute searches with structured JSON body. Concurrently crawls target URLs to extract OpenGraph cards, Twitter cards, and Schema.org data.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  query: { type: 'string', example: 'swagger' },
                  num: { type: 'integer', default: 8, example: 5 },
                  engine: {
                    type: 'string',
                    enum: ['auto', 'duckduckgo-html', 'bing', 'wikipedia', 'duckduckgo-lite', 'google'],
                    default: 'auto',
                  },
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
        responses: {
          '200': {
            description: 'Successful search results with extracted page metadata',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', example: 'swagger' },
                    totalResults: { type: 'integer', example: 8 },
                    results: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid search request',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
    '/api/crawl': {
      get: {
        tags: ['Crawler'],
        summary: 'Deep crawl a web page via GET query',
        description: 'Deeply crawl any URL, parsing HTML to extract OpenGraph, Twitter, JSON-LD schema, canonical URLs, and content word count.',
        parameters: [
          {
            name: 'url',
            in: 'query',
            required: true,
            description: 'Target URL to crawl (must start with http:// or https://)',
            schema: { type: 'string', example: 'https://swagger.io' },
          },
          {
            name: 'respectRobots',
            in: 'query',
            schema: { type: 'boolean', default: true },
          },
        ],
        responses: {
          '200': {
            description: 'Complete parsed page metadata',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
          '400': {
            description: 'Invalid or missing URL',
          },
          '502': {
            description: 'Failed to crawl target URL',
          },
        },
      },
      post: {
        tags: ['Crawler'],
        summary: 'Deep crawl a single web page via JSON POST',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  url: { type: 'string', example: 'https://swagger.io' },
                  respectRobots: { type: 'boolean', default: true },
                  timeoutMs: { type: 'integer', default: 12000 },
                },
                required: ['url'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Extracted OpenGraph, Twitter tags & Schema.org data',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
          '400': { description: 'Missing parameter' },
        },
      },
    },
    '/api/crawl/batch': {
      post: {
        tags: ['Crawler'],
        summary: 'Batch crawl multiple URLs concurrently',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  urls: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['https://swagger.io', 'https://github.com', 'https://wikipedia.org'],
                  },
                  concurrency: { type: 'integer', default: 4 },
                },
                required: ['urls'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Batch crawl report with individual page data',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
    '/api/robots-check': {
      get: {
        tags: ['Crawler'],
        summary: 'Inspect robots.txt crawl permission for any URL',
        parameters: [
          {
            name: 'url',
            in: 'query',
            required: true,
            schema: { type: 'string', example: 'https://github.com' },
          },
        ],
        responses: {
          '200': {
            description: 'Robots.txt rule compliance status',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
    '/api/weather': {
      get: {
        tags: ['Instant Answers'],
        summary: 'Retrieve live meteorological conditions and 5-day forecast',
        parameters: [
          {
            name: 'location',
            in: 'query',
            schema: { type: 'string', default: 'Tokyo', example: 'Tokyo' },
          },
        ],
        responses: {
          '200': {
            description: 'Live weather data & forecast',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
    '/api/time': {
      get: {
        tags: ['Instant Answers'],
        summary: 'Retrieve live timezone-aware exact time, UTC offset, and date',
        parameters: [
          {
            name: 'location',
            in: 'query',
            schema: { type: 'string', default: 'London', example: 'London' },
          },
        ],
        responses: {
          '200': {
            description: 'Live time & timezone information',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
    '/api/status': {
      get: {
        tags: ['System'],
        summary: 'Retrieve crawler engine health & rate-limiter stats',
        responses: {
          '200': {
            description: 'Service uptime and active rate limiter telemetry',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
    '/mcp': {
      post: {
        tags: ['System'],
        summary: 'Model Context Protocol (MCP) JSON-RPC 2.0 endpoint for AI Agents',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  jsonrpc: { type: 'string', example: '2.0' },
                  id: { type: 'string', example: '1' },
                  method: { type: 'string', example: 'tools/list' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'MCP JSON-RPC response',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
  },
};

/**
 * GET /api/docs & /openapi.json
 * OpenAPI 3.0.3 specification JSON.
 */
app.get(['/api/docs', '/openapi.json'], (req: Request, res: Response) => {
  res.json(openApiSpecification);
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CrawlerSearch API - Interactive Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body { margin: 0; background: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #f1f5f9; }
    .top-nav { background: #111827; border-bottom: 1px solid #1f2937; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
    .top-nav .brand { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 14px; color: #818cf8; text-decoration: none; }
    .top-nav .links { display: flex; align-items: center; gap: 8px; }
    .top-nav .btn { font-size: 12px; font-family: monospace; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-weight: 500; transition: all 0.15s; }
    .top-nav .btn-primary { background: #4f46e5; color: #fff; }
    .top-nav .btn-primary:hover { background: #4338ca; }
    .top-nav .btn-secondary { background: #1f2937; color: #94a3b8; border: 1px solid #374151; }
    .top-nav .btn-secondary:hover { background: #374151; color: #fff; }

    .swagger-ui .topbar { display: none; }
    .swagger-ui { color: #f1f5f9; }
    .swagger-ui .info { margin: 24px 0; }
    .swagger-ui .info .title { color: #818cf8; font-size: 26px; }
    .swagger-ui .info p, .swagger-ui .info li { color: #94a3b8; }
    .swagger-ui .scheme-container { background: #1e293b; box-shadow: none; border-bottom: 1px solid #334155; padding: 16px 0; }
    .swagger-ui .opblock { background: #111827; border: 1px solid #1f2937; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); }
    .swagger-ui .opblock .opblock-summary-method { border-radius: 6px; font-weight: 700; font-size: 12px; min-width: 70px; }
    .swagger-ui .opblock-summary-path { color: #f8fafc; font-weight: 600; font-family: monospace; }
    .swagger-ui .opblock-summary-description { color: #94a3b8; }
    .swagger-ui .opblock .opblock-section-header { background: #1e293b; color: #f1f5f9; }
    .swagger-ui .tabli button { color: #94a3b8; }
    .swagger-ui .tabli.active button { color: #818cf8; }
    .swagger-ui input[type=text], .swagger-ui select, .swagger-ui textarea { background: #0f172a !important; color: #f8fafc !important; border: 1px solid #334155 !important; border-radius: 6px !important; }
    .swagger-ui .btn.execute { background: #4f46e5 !important; border-color: #4f46e5 !important; color: #fff !important; font-weight: 600 !important; border-radius: 6px !important; }
    .swagger-ui .btn.execute:hover { background: #4338ca !important; }
    .swagger-ui .btn.try-out__btn { color: #818cf8 !important; border-color: #818cf8 !important; border-radius: 6px !important; }
    .swagger-ui .responses-inner { background: #0b0f19; }
    .swagger-ui .response-col_status { color: #34d399; font-weight: 700; font-family: monospace; }
    .swagger-ui .highlight-code pre { background: #020617 !important; color: #38bdf8 !important; border-radius: 6px; }
    .swagger-ui section.models { display: none; }
  </style>
</head>
<body>
  <div class="top-nav">
    <a href="/" class="brand">
      <span>🌐</span>
      <span>CrawlerSearch Interactive API Docs</span>
    </a>
    <div class="links">
      <a href="/api/search?q=swagger" target="_blank" class="btn btn-primary">⚡ Test GET /api/search?q=swagger</a>
      <a href="/openapi.json" target="_blank" class="btn btn-secondary">Raw openapi.json</a>
      <a href="/" class="btn btn-secondary">Web UI</a>
    </div>
  </div>

  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "BaseLayout",
        displayRequestDuration: true,
        docExpansion: "list",
        defaultModelsExpandDepth: 1,
        tryItOutEnabled: true,
        showExtensions: true,
        filter: true
      });
      window.ui = ui;
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

