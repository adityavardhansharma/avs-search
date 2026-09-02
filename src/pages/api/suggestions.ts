export const prerender = false;

// Simple LRU cache implementation
class LRUCache {
  private capacity: number;
  private cache: Map<string, string[]>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: string): string[] | undefined {
    if (!this.cache.has(key)) return undefined;
    // Move to most recently used
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key: string, value: string[]): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value as string;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}

// Shared across warm serverless instances
const suggestionsCache = new LRUCache(2000);

interface DuckItem {
  phrase?: string;
}

export async function GET({ request }: { request: Request }): Promise<Response> {
  const url = new URL(request.url);
  const q = url.searchParams.get('q');

  if (!q || q.trim() === '') {
    return Response.json([]);
  }

  const query = q.trim().toLowerCase();

  const cachedResult = suggestionsCache.get(query);
  if (cachedResult) {
    return Response.json(cachedResult, {
      headers: {
        'Cache-Control': 's-maxage=600, stale-while-revalidate=86400',
      },
    });
  }

  try {
    const response = await fetch(
      `https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=json`,
      { signal: AbortSignal.timeout(800) },
    );

    let suggestions: string[] = [];

    const data: unknown = await response.json();
    if (Array.isArray(data)) {
      suggestions = (data as (DuckItem | string)[])
        .map((item) => (typeof item === 'string' ? item : item.phrase ?? ''))
        .filter(Boolean)
        .slice(0, 10);
    }

    suggestionsCache.put(query, suggestions);

    return Response.json(suggestions, {
      headers: {
        'Cache-Control': 's-maxage=600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching suggestions:', (error as Error).message || error);
    return Response.json([]);
  }
}
