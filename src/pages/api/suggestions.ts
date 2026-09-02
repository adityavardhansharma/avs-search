export const prerender = false;

// Tunables — chosen for a typeahead API: fail fast, cache aggressively,
// avoid hitting DuckDuckGo on every keystroke.
const CACHE_CAPACITY = 2000;
const TTL_POSITIVE_MS = 10 * 60 * 1000; // 10 min for real results
const TTL_NEGATIVE_MS = 60 * 1000; // 60 s for empty/error (prevents hammering)
const MIN_QUERY_LEN = 2;
const MAX_QUERY_LEN = 100;
const MAX_SUGGESTIONS = 8;
const UPSTREAM_TIMEOUT_MS = 900;
// Only scan back this far for a prefix hit — keeps the fast path O(1).
const PREFIX_LOOKUP_DEPTH = 8;

const CACHE_HEADERS = {
  // Browser caches briefly (instant repeat keystrokes), CDN caches longer.
  'Cache-Control': 'public, max-age=120, s-maxage=600, stale-while-revalidate=86400',
};

interface CacheEntry {
  value: string[];
  expires: number;
}

// Tiny TTL-LRU. Map preserves insertion order, so the first key is the oldest.
class TTLCache {
  private capacity: number;
  private store = new Map<string, CacheEntry>();

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: string): string[] | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.store.delete(key);
      return undefined;
    }
    // Refresh recency without resetting TTL.
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  put(key: string, value: string[], ttlMs: number): void {
    if (this.store.has(key)) this.store.delete(key);
    else if (this.store.size >= this.capacity) {
      const oldest = this.store.keys().next().value as string | undefined;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expires: Date.now() + ttlMs });
  }
}

// Shared across warm serverless instances. Coalesces concurrent identical
// upstream fetches so 20 users typing "hello" trigger 1 DuckDuckGo call.
const suggestionsCache = new TTLCache(CACHE_CAPACITY);
const inflight = new Map<string, Promise<string[]>>();

interface DuckItem {
  phrase?: string;
}

function normalize(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, MAX_QUERY_LEN);
}

/**
 * Prefix fast path: typing "hellow" after "hello" was cached can be served
 * synchronously by filtering — no upstream round-trip (~200-600ms saved).
 * Only scans the last few chars back to keep it cheap.
 */
function prefixHit(query: string): string[] | undefined {
  const start = Math.max(MIN_QUERY_LEN, query.length - PREFIX_LOOKUP_DEPTH);
  for (let len = query.length - 1; len >= start; len--) {
    const prefix = query.slice(0, len);
    const cached = suggestionsCache.get(prefix);
    if (!cached || cached.length === 0) continue;
    const filtered = cached.filter((s) => s.toLowerCase().startsWith(query));
    if (filtered.length > 0) return filtered.slice(0, MAX_SUGGESTIONS);
    // Cached prefix exists but nothing matches — still useful negative-ish
    // signal, but keep looking at shorter prefixes before giving up.
  }
  return undefined;
}

async function fetchUpstream(query: string): Promise<string[]> {
  const response = await fetch(`https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=json`, {
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    headers: {
      Accept: 'application/json',
      // DDG throttles default fetch/libcurl UAs; a browser UA is far faster.
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      Referer: 'https://duckduckgo.com/',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!response.ok) throw new Error(`upstream ${response.status}`);
  const data: unknown = await response.json();
  if (!Array.isArray(data)) return [];
  return (data as (DuckItem | string)[])
    .map((item) => (typeof item === 'string' ? item : (item.phrase ?? '')))
    .filter(Boolean)
    .slice(0, MAX_SUGGESTIONS);
}

function getOrFetch(query: string): Promise<string[]> {
  const existing = inflight.get(query);
  if (existing) return existing;
  const task = fetchUpstream(query)
    .then((suggestions) => {
      suggestionsCache.put(query, suggestions, suggestions.length ? TTL_POSITIVE_MS : TTL_NEGATIVE_MS);
      return suggestions;
    })
    .catch((error) => {
      console.error('Error fetching suggestions:', (error as Error).message || error);
      // Serve a stale prefix-filtered fallback instead of a blank list when
      // the upstream blips mid-word.
      return prefixHit(query) ?? [];
    })
    .finally(() => {
      inflight.delete(query);
    });
  inflight.set(query, task);
  return task;
}

export async function GET({ request }: { request: Request }): Promise<Response> {
  const url = new URL(request.url);
  const raw = url.searchParams.get('q');

  if (!raw || raw.trim() === '') return Response.json([], { headers: CACHE_HEADERS });

  const query = normalize(raw);
  if (query.length < MIN_QUERY_LEN) {
    // Fail fast: 1-char queries are noisy, huge, and rarely useful.
    return Response.json([], { headers: CACHE_HEADERS });
  }

  const cached = suggestionsCache.get(query);
  if (cached) return Response.json(cached, { headers: CACHE_HEADERS });

  const prefixed = prefixHit(query);
  if (prefixed) {
    // Return instantly AND refresh in the background is the client's job
    // (SWR). Cache the filtered subset briefly so repeats are free.
    suggestionsCache.put(query, prefixed, TTL_POSITIVE_MS);
    // Kick off a background revalidation without blocking the response.
    void getOrFetch(query);
    return Response.json(prefixed, { headers: CACHE_HEADERS });
  }

  const suggestions = await getOrFetch(query);
  return Response.json(suggestions, { headers: CACHE_HEADERS });
}
