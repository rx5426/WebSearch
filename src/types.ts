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

  title?: string;
  description?: string;
  canonical?: string;
  favicon?: string;
  language?: string;
  charset?: string;
  author?: string;
  keywords?: string[];
  robotsDirective?: string;

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

  twitter: {
    card?: string;
    site?: string;
    creator?: string;
    title?: string;
    description?: string;
    image?: string;
  };

  jsonLd: Array<{
    type?: string;
    raw: Record<string, any>;
  }>;

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

  preview: {
    title: string;
    description: string;
    image?: string;
    domain: string;
  };
}

export type SearchEngineProvider =
  | 'google-grounding-api'
  | 'duckduckgo-html'
  | 'duckduckgo-lite'
  | 'bing-search'
  | 'wikipedia-search'
  | 'google-news-rss'
  | 'live-web-engine'
  | 'curated-fallback';

export interface SearchResultItem {
  id: string;
  rank: number;
  title: string;
  url: string;
  displayUrl: string;
  snippet: string;
  sourceEngine?: string;
  metadata?: CrawlMetadata;
  crawlError?: string;
}

export interface WeatherData {
  location: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  elevation: number;
  current: {
    temperatureC: number;
    temperatureF: number;
    feelsLikeC: number;
    feelsLikeF: number;
    condition: string;
    conditionCode: number;
    conditionCategory: 'clear' | 'cloudy' | 'rain' | 'snow' | 'thunder' | 'fog';
    humidityPercent: number;
    windSpeedKph: number;
    windSpeedMph: number;
    precipitationMm: number;
    isDay: boolean;
    timestamp: string;
  };
  forecast: Array<{
    date: string;
    dayName: string;
    maxTempC: number;
    minTempC: number;
    maxTempF: number;
    minTempF: number;
    condition: string;
    conditionCategory: 'clear' | 'cloudy' | 'rain' | 'snow' | 'thunder' | 'fog';
    precipitationProbability: number;
  }>;
}

export interface TimeData {
  location: string;
  country?: string;
  timezone: string;
  currentTimeFormatted: string;
  time12h: string;
  time24h: string;
  dateFormatted: string;
  dayOfWeek: string;
  utcOffset: string;
  unixTimestamp: number;
  isDaytime: boolean;
}

export interface SearchResponse {
  query: string;
  totalResults: number;
  executionTimeMs: number;
  engine: SearchEngineProvider;
  failoverTrail?: string[];
  geminiQuotaExhausted?: boolean;
  webSearchQueries?: string[];
  summary?: string;
  instantAnswer?: {
    type: 'weather' | 'time';
    weather?: WeatherData;
    time?: TimeData;
  };
  results: SearchResultItem[];
  antiScrapingStatus: {
    bypassedProtections: string[];
    rateLimitCompliant: boolean;
    concurrentCrawls: number;
  };
}

export interface SystemStatus {
  status: string;
  timestamp: string;
  uptimeSeconds: number;
  geminiConfigured: boolean;
  engine: {
    searchEngine: string;
    crawlerEngine: string;
    rateLimiter: {
      totalRequestsSent: number;
      totalThrottled: number;
      totalRetried: number;
      activeRequests: number;
      queuedRequests: number;
      trackedDomains: number;
    };
  };
}
