/**
 * Lightweight robots.txt fetcher and parser with in-memory caching.
 * Ensures crawlers can be polite and avoid crawling prohibited paths.
 */

interface RobotsRule {
  userAgent: string;
  disallows: string[];
  allows: string[];
  crawlDelay?: number;
}

interface DomainRobotsData {
  rules: RobotsRule[];
  fetchedAt: number;
  rawText: string;
}

export class RobotsParser {
  private cache: Map<string, DomainRobotsData> = new Map();
  private cacheTtlMs = 60 * 60 * 1000; // 1 hour

  /**
   * Fetches and parses robots.txt for a given URL or domain.
   */
  public async getRobots(targetUrl: string, timeoutMs = 4000): Promise<DomainRobotsData> {
    const parsed = new URL(targetUrl);
    const domain = parsed.hostname.toLowerCase();
    const origin = parsed.origin;

    const cached = this.cache.get(domain);
    if (cached && Date.now() - cached.fetchedAt < this.cacheTtlMs) {
      return cached;
    }

    const robotsUrl = `${origin}/robots.txt`;
    let rawText = '';

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const resp = await fetch(robotsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (resp.ok) {
        rawText = await resp.text();
      }
    } catch {
      // If robots.txt fails to load (timeout or 404), default to empty rules (allow by default)
      rawText = '';
    }

    const rules = this.parseRobotsText(rawText);
    const data: DomainRobotsData = {
      rules,
      fetchedAt: Date.now(),
      rawText: rawText.slice(0, 5000), // keep sample
    };

    this.cache.set(domain, data);
    return data;
  }

  /**
   * Checks if a path is allowed for a given URL
   */
  public async isAllowed(targetUrl: string, botName = '*'): Promise<{ allowed: boolean; reason: string; crawlDelay?: number }> {
    try {
      const parsed = new URL(targetUrl);
      const pathname = parsed.pathname || '/';
      const robotsData = await this.getRobots(targetUrl);

      // Find matching rules: check specific botName first, then wildcard '*'
      let activeRule = robotsData.rules.find((r) => r.userAgent.toLowerCase() === botName.toLowerCase());
      if (!activeRule) {
        activeRule = robotsData.rules.find((r) => r.userAgent === '*');
      }

      if (!activeRule) {
        return { allowed: true, reason: 'No robots.txt rules specified' };
      }

      // Check explicit allows first
      for (const allow of activeRule.allows) {
        if (pathname.startsWith(allow)) {
          return { allowed: true, reason: `Explicitly allowed by rule: Allow: ${allow}`, crawlDelay: activeRule.crawlDelay };
        }
      }

      // Check disallows
      for (const disallow of activeRule.disallows) {
        if (disallow === '' || disallow === '/') {
          if (disallow === '/' && pathname === '/') {
            return { allowed: false, reason: 'Disallowed root path: Disallow: /', crawlDelay: activeRule.crawlDelay };
          }
          if (disallow === '/') {
            return { allowed: false, reason: 'Disallowed site-wide: Disallow: /', crawlDelay: activeRule.crawlDelay };
          }
        } else if (disallow && pathname.startsWith(disallow)) {
          return { allowed: false, reason: `Disallowed by rule: Disallow: ${disallow}`, crawlDelay: activeRule.crawlDelay };
        }
      }

      return { allowed: true, reason: 'Allowed by default', crawlDelay: activeRule.crawlDelay };
    } catch (e: any) {
      return { allowed: true, reason: `Error checking robots: ${e.message}` };
    }
  }

  private parseRobotsText(text: string): RobotsRule[] {
    const lines = text.split('\n');
    const rules: RobotsRule[] = [];
    let currentRule: RobotsRule | null = null;

    for (let rawLine of lines) {
      const line = rawLine.split('#')[0].trim();
      if (!line) continue;

      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;

      const directive = line.slice(0, colonIdx).trim().toLowerCase();
      const value = line.slice(colonIdx + 1).trim();

      if (directive === 'user-agent') {
        currentRule = {
          userAgent: value,
          disallows: [],
          allows: [],
        };
        rules.push(currentRule);
      } else if (currentRule) {
        if (directive === 'disallow') {
          if (value) currentRule.disallows.push(value);
        } else if (directive === 'allow') {
          if (value) currentRule.allows.push(value);
        } else if (directive === 'crawl-delay') {
          const delay = parseFloat(value);
          if (!isNaN(delay)) currentRule.crawlDelay = delay;
        }
      }
    }

    return rules;
  }
}

export const robotsParser = new RobotsParser();
