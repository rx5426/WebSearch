/**
 * Resilient Web Crawler & Deep Metadata Extractor
 * Features anti-scraping evasion headers, polite per-domain rate limiting,
 * exponential backoff, robots.txt checks, and comprehensive schema/OG parsing.
 */

import * as cheerio from 'cheerio';
import { globalRateLimiter } from './rateLimiter.ts';
import { robotsParser } from './robotsParser.ts';

export interface CrawlMetadata {
  url: string;
  finalUrl: string;
  statusCode: number;
  statusText: string;
  latencyMs: number;
  contentType: string;
  contentLength?: number;
  server?: string;
  crawledAt: string;

  // Anti-blocking and protection telemetry
  antiBotStatus: {
    retriesCount: number;
    backoffAppliedMs: number;
    challengeDetected: boolean;
    challengeType?: string;
    userAgentUsed: string;
    robotsChecked: boolean;
    robotsAllowed: boolean;
    robotsReason?: string;
  };

  // Basic Page Meta
  title?: string;
  description?: string;
  canonical?: string;
  favicon?: string;
  language?: string;
  charset?: string;
  author?: string;
  keywords?: string[];
  robotsDirective?: string;

  // OpenGraph Data
  openGraph: {
    title?: string;
    description?: string;
    image?: string;
    imageAlt?: string;
    url?: string;
    siteName?: string;
    type?: string;
    locale?: string;
  };

  // Twitter Cards Data
  twitter: {
    card?: string;
    site?: string;
    creator?: string;
    title?: string;
    description?: string;
    image?: string;
  };

  // Schema.org Structured Data
  jsonLd: Array<{
    type?: string;
    raw: Record<string, any>;
  }>;

  // Page Content Analysis
  contentMetrics: {
    wordCount: number;
    readingTimeMinutes: number;
    h1s: string[];
    h2Count: number;
    h3Count: number;
    linksCount: {
      total: number;
      internal: number;
      external: number;
    };
    imagesCount: number;
  };

  // Preview Card helper
  preview: {
    title: string;
    description: string;
    image?: string;
    domain: string;
  };
}

export interface CrawlOptions {
  timeoutMs?: number;
  maxRetries?: number;
  respectRobots?: boolean;
  customHeaders?: Record<string, string>;
  customDelayMs?: number;
  maxContentLengthBytes?: number;
}

// Modern Browser Header Pools for Anti-Scraping Evasion
const USER_AGENTS = [
  {
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    platform: '"macOS"',
    brand: '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
  },
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    platform: '"Windows"',
    brand: '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
  },
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0',
    platform: '"Windows"',
    brand: null,
  },
  {
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15',
    platform: '"macOS"',
    brand: null,
  },
];

export class CrawlerEngine {
  private getStealthHeaders(targetUrl: string, custom?: Record<string, string>): Record<string, string> {
    const profile = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const parsed = new URL(targetUrl);

    const headers: Record<string, string> = {
      'User-Agent': profile.ua,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Referer': `${parsed.protocol}//${parsed.hostname}/`,
    };

    if (profile.brand) {
      headers['sec-ch-ua'] = profile.brand;
      headers['sec-ch-ua-mobile'] = '?0';
      headers['sec-ch-ua-platform'] = profile.platform;
    }

    if (custom) {
      Object.assign(headers, custom);
    }

    return headers;
  }

  /**
   * Crawls a single URL with anti-blocking resilience, retries, and rate limiting.
   */
  public async crawlUrl(url: string, options: CrawlOptions = {}): Promise<CrawlMetadata> {
    const timeoutMs = options.timeoutMs ?? 12000;
    const maxRetries = options.maxRetries ?? 2;
    const respectRobots = options.respectRobots ?? true;
    const maxBytes = options.maxContentLengthBytes ?? 5 * 1024 * 1024; // 5MB

    // 1. Robots.txt Compliance Check
    let robotsAllowed = true;
    let robotsReason = 'Robots check disabled';
    if (respectRobots) {
      const robotsCheck = await robotsParser.isAllowed(url);
      robotsAllowed = robotsCheck.allowed;
      robotsReason = robotsCheck.reason;
      if (!robotsAllowed) {
        throw new Error(`Crawl disallowed by robots.txt: ${robotsReason}`);
      }
    }

    // 2. Schedule via per-domain rate limiter
    return globalRateLimiter.schedule(url, async () => {
      let retriesCount = 0;
      let backoffAppliedMs = 0;
      let lastError: any = null;

      while (retriesCount <= maxRetries) {
        const startTime = Date.now();
        const headers = this.getStealthHeaders(url, options.customHeaders);

        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), timeoutMs);

          const response = await fetch(url, {
            headers,
            signal: controller.signal,
            redirect: 'follow',
          });

          clearTimeout(timer);
          const latencyMs = Date.now() - startTime;

          // 3. Rate-limit detection & backoff (HTTP 429 or 503)
          if (response.status === 429 || response.status === 503) {
            globalRateLimiter.recordRetry();
            retriesCount++;
            if (retriesCount <= maxRetries) {
              const retryAfter = response.headers.get('retry-after');
              let waitMs = 1500 * Math.pow(2, retriesCount) + Math.random() * 500;
              if (retryAfter) {
                const parsedSeconds = parseInt(retryAfter, 10);
                if (!isNaN(parsedSeconds) && parsedSeconds > 0) {
                  waitMs = Math.min(parsedSeconds * 1000, 10000);
                }
              }
              backoffAppliedMs += waitMs;
              await new Promise((r) => setTimeout(r, waitMs));
              continue;
            }
          }

          const contentType = response.headers.get('content-type') || '';
          const contentLengthHeader = response.headers.get('content-length');
          const contentLength = contentLengthHeader ? parseInt(contentLengthHeader, 10) : undefined;
          const serverHeader = response.headers.get('server') || undefined;

          // Only parse HTML/text contents
          if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml') && !contentType.includes('text/plain')) {
            return this.buildNonHtmlMetadata(url, response, latencyMs, {
              retriesCount,
              backoffAppliedMs,
              userAgentUsed: headers['User-Agent'],
              robotsChecked: respectRobots,
              robotsAllowed,
              robotsReason,
            });
          }

          const html = await response.text();
          const finalUrl = response.url || url;

          return this.parseHtmlMetadata({
            url,
            finalUrl,
            html: html.slice(0, maxBytes),
            statusCode: response.status,
            statusText: response.statusText,
            latencyMs,
            contentType,
            contentLength: contentLength || html.length,
            server: serverHeader,
            antiBotStats: {
              retriesCount,
              backoffAppliedMs,
              userAgentUsed: headers['User-Agent'],
              robotsChecked: respectRobots,
              robotsAllowed,
              robotsReason,
            },
          });
        } catch (err: any) {
          lastError = err;
          retriesCount++;
          if (retriesCount <= maxRetries) {
            const waitMs = 1000 * Math.pow(1.5, retriesCount) + Math.random() * 300;
            backoffAppliedMs += waitMs;
            await new Promise((r) => setTimeout(r, waitMs));
            continue;
          }
          break;
        }
      }

      throw new Error(`Failed to crawl ${url} after ${retriesCount} retries: ${lastError?.message || 'Unknown network error'}`);
    }, options.customDelayMs);
  }

  /**
   * Deep HTML Parser extracting Title, Meta, OG, Twitter, JSON-LD, Headings, and Content Metrics
   */
  private parseHtmlMetadata(params: {
    url: string;
    finalUrl: string;
    html: string;
    statusCode: number;
    statusText: string;
    latencyMs: number;
    contentType: string;
    contentLength: number;
    server?: string;
    antiBotStats: {
      retriesCount: number;
      backoffAppliedMs: number;
      userAgentUsed: string;
      robotsChecked: boolean;
      robotsAllowed: boolean;
      robotsReason: string;
    };
  }): CrawlMetadata {
    const { url, finalUrl, html, statusCode, statusText, latencyMs, contentType, contentLength, server, antiBotStats } = params;
    const $ = cheerio.load(html);

    // Resolve relative URLs to absolute
    const resolveUrl = (relativeOrAbsolute?: string): string | undefined => {
      if (!relativeOrAbsolute) return undefined;
      try {
        return new URL(relativeOrAbsolute, finalUrl).href;
      } catch {
        return relativeOrAbsolute;
      }
    };

    // 1. Core Meta Extraction
    const title =
      $('title').first().text().trim() ||
      $('meta[property="og:title"]').attr('content')?.trim() ||
      $('meta[name="twitter:title"]').attr('content')?.trim() ||
      $('h1').first().text().trim() ||
      undefined;

    const description =
      $('meta[name="description"]').attr('content')?.trim() ||
      $('meta[property="og:description"]').attr('content')?.trim() ||
      $('meta[name="twitter:description"]').attr('content')?.trim() ||
      $('p').first().text().trim().slice(0, 200) ||
      undefined;

    const canonicalRaw = $('link[rel="canonical"]').attr('href');
    const canonical = resolveUrl(canonicalRaw);

    const faviconRaw =
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      $('link[rel="apple-touch-icon"]').attr('href') ||
      '/favicon.ico';
    const favicon = resolveUrl(faviconRaw);

    const language = $('html').attr('lang') || $('meta[http-equiv="content-language"]').attr('content') || undefined;
    const charset = $('meta[charset]').attr('charset') || undefined;
    const author = $('meta[name="author"]').attr('content') || $('meta[property="article:author"]').attr('content') || undefined;
    const keywordsRaw = $('meta[name="keywords"]').attr('content');
    const keywords = keywordsRaw ? keywordsRaw.split(',').map((k) => k.trim()).filter(Boolean) : undefined;
    const robotsDirective = $('meta[name="robots"]').attr('content');

    // 2. OpenGraph Extraction
    const ogImageRaw = $('meta[property="og:image"]').attr('content') || $('meta[property="og:image:url"]').attr('content');
    const openGraph = {
      title: $('meta[property="og:title"]').attr('content')?.trim(),
      description: $('meta[property="og:description"]').attr('content')?.trim(),
      image: resolveUrl(ogImageRaw),
      imageAlt: $('meta[property="og:image:alt"]').attr('content')?.trim(),
      url: resolveUrl($('meta[property="og:url"]').attr('content')),
      siteName: $('meta[property="og:site_name"]').attr('content')?.trim(),
      type: $('meta[property="og:type"]').attr('content')?.trim(),
      locale: $('meta[property="og:locale"]').attr('content')?.trim(),
    };

    // 3. Twitter Cards Extraction
    const twitterImageRaw = $('meta[name="twitter:image"]').attr('content') || $('meta[name="twitter:image:src"]').attr('content');
    const twitter = {
      card: $('meta[name="twitter:card"]').attr('content')?.trim(),
      site: $('meta[name="twitter:site"]').attr('content')?.trim(),
      creator: $('meta[name="twitter:creator"]').attr('content')?.trim(),
      title: $('meta[name="twitter:title"]').attr('content')?.trim(),
      description: $('meta[name="twitter:description"]').attr('content')?.trim(),
      image: resolveUrl(twitterImageRaw),
    };

    // 4. Schema.org JSON-LD Extraction
    const jsonLd: Array<{ type?: string; raw: Record<string, any> }> = [];
    $('script[type="application/ld+json"]').each((_, elem) => {
      try {
        const rawText = $(elem).text().trim();
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (Array.isArray(parsed)) {
            parsed.forEach((item) => {
              jsonLd.push({
                type: item['@type'] || 'Object',
                raw: item,
              });
            });
          } else if (typeof parsed === 'object' && parsed !== null) {
            jsonLd.push({
              type: parsed['@type'] || 'Object',
              raw: parsed,
            });
          }
        }
      } catch {
        // Skip malformed JSON-LD scripts
      }
    });

    // 5. Anti-Bot Challenge Signature Detection
    let challengeDetected = false;
    let challengeType: string | undefined = undefined;

    const lowerHtml = html.toLowerCase();
    const pageTitleLower = (title || '').toLowerCase();

    if (
      pageTitleLower.includes('attention required! | cloudflare') ||
      pageTitleLower.includes('just a moment...') ||
      lowerHtml.includes('cf-browser-verification') ||
      lowerHtml.includes('challenge-platform')
    ) {
      challengeDetected = true;
      challengeType = 'Cloudflare Ray / Turnstile Challenge';
    } else if (pageTitleLower.includes('access denied') || lowerHtml.includes('perimeterx') || lowerHtml.includes('datadome')) {
      challengeDetected = true;
      challengeType = 'WAF Access Restriction (DataDome / PerimeterX)';
    }

    // 6. Content Analysis Metrics
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const words = bodyText.split(' ').filter((w) => w.length > 0);
    const wordCount = words.length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

    const h1s: string[] = [];
    $('h1').each((_, el) => {
      const text = $(el).text().trim();
      if (text && !h1s.includes(text)) h1s.push(text);
    });

    const h2Count = $('h2').length;
    const h3Count = $('h3').length;

    let internalLinks = 0;
    let externalLinks = 0;
    const origin = new URL(finalUrl).origin;

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
      try {
        const linkUrl = new URL(href, finalUrl);
        if (linkUrl.origin === origin) {
          internalLinks++;
        } else {
          externalLinks++;
        }
      } catch {
        // ignore invalid url
      }
    });

    const imagesCount = $('img').length;
    const domain = new URL(finalUrl).hostname;

    return {
      url,
      finalUrl,
      statusCode,
      statusText,
      latencyMs,
      contentType,
      contentLength,
      server,
      crawledAt: new Date().toISOString(),
      antiBotStatus: {
        retriesCount: antiBotStats.retriesCount,
        backoffAppliedMs: antiBotStats.backoffAppliedMs,
        challengeDetected,
        challengeType,
        userAgentUsed: antiBotStats.userAgentUsed,
        robotsChecked: antiBotStats.robotsChecked,
        robotsAllowed: antiBotStats.robotsAllowed,
        robotsReason: antiBotStats.robotsReason,
      },
      title,
      description,
      canonical,
      favicon,
      language,
      charset,
      author,
      keywords,
      robotsDirective,
      openGraph,
      twitter,
      jsonLd,
      contentMetrics: {
        wordCount,
        readingTimeMinutes,
        h1s,
        h2Count,
        h3Count,
        linksCount: {
          total: internalLinks + externalLinks,
          internal: internalLinks,
          external: externalLinks,
        },
        imagesCount,
      },
      preview: {
        title: openGraph.title || twitter.title || title || domain,
        description: openGraph.description || twitter.description || description || 'No summary available.',
        image: openGraph.image || twitter.image,
        domain,
      },
    };
  }

  private buildNonHtmlMetadata(
    url: string,
    response: Response,
    latencyMs: number,
    antiBotStats: any
  ): CrawlMetadata {
    const domain = new URL(url).hostname;
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);

    return {
      url,
      finalUrl: response.url || url,
      statusCode: response.status,
      statusText: response.statusText,
      latencyMs,
      contentType,
      contentLength,
      server: response.headers.get('server') || undefined,
      crawledAt: new Date().toISOString(),
      antiBotStatus: {
        retriesCount: antiBotStats.retriesCount,
        backoffAppliedMs: antiBotStats.backoffAppliedMs,
        challengeDetected: false,
        userAgentUsed: antiBotStats.userAgentUsed,
        robotsChecked: antiBotStats.robotsChecked,
        robotsAllowed: antiBotStats.robotsAllowed,
        robotsReason: antiBotStats.robotsReason,
      },
      title: `${domain} (${contentType})`,
      description: `Non-HTML binary or document content: ${contentType}`,
      openGraph: {},
      twitter: {},
      jsonLd: [],
      contentMetrics: {
        wordCount: 0,
        readingTimeMinutes: 0,
        h1s: [],
        h2Count: 0,
        h3Count: 0,
        linksCount: { total: 0, internal: 0, external: 0 },
        imagesCount: 0,
      },
      preview: {
        title: `${domain} [${contentType}]`,
        description: `Direct media or data response (${contentLength} bytes)`,
        domain,
      },
    };
  }
}

export const crawlerEngine = new CrawlerEngine();
