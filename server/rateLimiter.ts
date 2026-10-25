/**
 * In-memory Token-Bucket & Per-Domain Rate Limiter with Concurrency Queue
 * Prevents anti-scraping IP bans and 429 Too Many Requests errors.
 */

interface DomainQueueItem {
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

export class ResilientRateLimiter {
  private domainLastHit: Map<string, number> = new Map();
  private domainQueues: Map<string, DomainQueueItem[]> = new Map();
  private activeDomainRequests: Map<string, number> = new Map();
  private totalRequestsSent = 0;
  private totalThrottled = 0;
  private totalRetried = 0;

  // Defaults
  private defaultDomainDelayMs = 600; // minimum delay between hits to same domain
  private maxConcurrentPerDomain = 2; // max simultaneous hits to same domain

  constructor(options?: { defaultDomainDelayMs?: number; maxConcurrentPerDomain?: number }) {
    if (options?.defaultDomainDelayMs) this.defaultDomainDelayMs = options.defaultDomainDelayMs;
    if (options?.maxConcurrentPerDomain) this.maxConcurrentPerDomain = options.maxConcurrentPerDomain;
  }

  /**
   * Extract hostname safely from URL
   */
  public getDomain(urlString: string): string {
    try {
      const parsed = new URL(urlString);
      return parsed.hostname.toLowerCase();
    } catch {
      return 'unknown_domain';
    }
  }

  /**
   * Schedule a task respecting per-domain rate limit
   */
  public async schedule<T>(url: string, fn: () => Promise<T>, customDelayMs?: number): Promise<T> {
    const domain = this.getDomain(url);
    const delay = customDelayMs ?? this.defaultDomainDelayMs;

    return new Promise<T>((resolve, reject) => {
      if (!this.domainQueues.has(domain)) {
        this.domainQueues.set(domain, []);
      }

      this.domainQueues.get(domain)!.push({
        fn,
        resolve,
        reject,
      });

      this.processQueue(domain, delay);
    });
  }

  private async processQueue(domain: string, delayMs: number) {
    const queue = this.domainQueues.get(domain);
    if (!queue || queue.length === 0) return;

    const active = this.activeDomainRequests.get(domain) || 0;
    if (active >= this.maxConcurrentPerDomain) {
      return;
    }

    const now = Date.now();
    const lastHit = this.domainLastHit.get(domain) || 0;
    const elapsed = now - lastHit;

    if (elapsed < delayMs) {
      this.totalThrottled++;
      const waitTime = delayMs - elapsed + Math.floor(Math.random() * 150); // add slight jitter
      setTimeout(() => this.processQueue(domain, delayMs), waitTime);
      return;
    }

    const item = queue.shift();
    if (!item) return;

    this.activeDomainRequests.set(domain, active + 1);
    this.domainLastHit.set(domain, Date.now());
    this.totalRequestsSent++;

    try {
      const result = await item.fn();
      item.resolve(result);
    } catch (err) {
      item.reject(err);
    } finally {
      const currentActive = this.activeDomainRequests.get(domain) || 1;
      this.activeDomainRequests.set(domain, Math.max(0, currentActive - 1));
      // Process next in line after delay
      setTimeout(() => this.processQueue(domain, delayMs), delayMs);
    }
  }

  public recordRetry() {
    this.totalRetried++;
  }

  public getStats() {
    let queuedItems = 0;
    for (const q of this.domainQueues.values()) {
      queuedItems += q.length;
    }
    let activeItems = 0;
    for (const a of this.activeDomainRequests.values()) {
      activeItems += a;
    }

    return {
      totalRequestsSent: this.totalRequestsSent,
      totalThrottled: this.totalThrottled,
      totalRetried: this.totalRetried,
      activeRequests: activeItems,
      queuedRequests: queuedItems,
      trackedDomains: this.domainLastHit.size,
    };
  }
}

export const globalRateLimiter = new ResilientRateLimiter();
