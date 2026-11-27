# frozen_string_literal: true

require "net/http"
require "uri"
require "thread"

# Identical port of src/pages/api/suggestions.ts (Astro).
# Same tunables, same TTL-LRU, same prefix fast-path, same DuckDuckGo
# upstream, same inflight coalescing, same cache headers.
class SuggestionsController < ApplicationController
  CACHE_CAPACITY = 2000
  TTL_POSITIVE = 10 * 60 # 10 min for real results
  TTL_NEGATIVE = 60 # 60 s for empty/error (prevents hammering)
  MIN_QUERY_LEN = 2
  MAX_QUERY_LEN = 100
  MAX_SUGGESTIONS = 8
  UPSTREAM_TIMEOUT = 0.9 # seconds — fail fast, like AbortSignal.timeout(900)
  # Only scan back this far for a prefix hit — keeps the fast path O(1).
  PREFIX_LOOKUP_DEPTH = 8

  # Shared across requests on a warm process. Mutex-guarded ordered Hash
  # acts as the TTL-LRU (insertion-ordered; first key is the oldest).
  CACHE = {}
  CACHE_MUTEX = Mutex.new
  # Coalesces concurrent identical upstream fetches so 20 users typing
  # "hello" trigger 1 DuckDuckGo call.
  INFLIGHT = {}
  INFLIGHT_MUTEX = Mutex.new

  BROWSER_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

  def index
    # Browser caches briefly (instant repeat keystrokes), CDN caches longer.
    response.headers["Cache-Control"] = "public, max-age=120, s-maxage=600, stale-while-revalidate=86400"

    raw = params[:q]
    return render json: [] if raw.blank?

    query = normalize(raw)
    # Fail fast: 1-char queries are noisy, huge, and rarely useful.
    return render json: [] if query.length < MIN_QUERY_LEN

    cached = cache_get(query)
    return render json: cached if cached

    prefixed = prefix_hit(query)
    if prefixed
      # Return instantly AND refresh in the background (client does SWR).
      # Cache the filtered subset briefly so repeats are free.
      cache_put(query, prefixed, TTL_POSITIVE)
      # Kick off a background revalidation without blocking the response.
      Thread.new { get_or_fetch(query) }
      return render json: prefixed
    end

    render json: get_or_fetch(query)
  end

  private

  def normalize(raw)
    raw.strip.downcase.gsub(/\s+/, " ")[0, MAX_QUERY_LEN]
  end

  def cache_get(key)
    CACHE_MUTEX.synchronize do
      entry = CACHE[key]
      return nil unless entry
      if Time.now.to_i > entry[:expires]
        CACHE.delete(key)
        return nil
      end
      # Refresh recency without resetting TTL.
      CACHE.delete(key)
      CACHE[key] = entry
      entry[:value]
    end
  end

  def cache_put(key, value, ttl)
    CACHE_MUTEX.synchronize do
      CACHE.delete(key)
      CACHE.shift if CACHE.size >= CACHE_CAPACITY && !CACHE.key?(key)
      CACHE[key] = { value: value, expires: Time.now.to_i + ttl }
    end
  end

  # Prefix fast path: typing "hellow" after "hello" was cached can be served
  # synchronously by filtering — no upstream round-trip (~200-600ms saved).
  # Only scans the last few chars back to keep it cheap.
  def prefix_hit(query)
    start = [MIN_QUERY_LEN, query.length - PREFIX_LOOKUP_DEPTH].max
    (query.length - 1).downto(start) do |len|
      prefix = query[0, len]
      cached = cache_get(prefix)
      next if cached.nil? || cached.empty?
      filtered = cached.select { |s| s.downcase.start_with?(query) }
      return filtered[0, MAX_SUGGESTIONS] unless filtered.empty?
      # Cached prefix exists but nothing matches — still useful negative-ish
      # signal, but keep looking at shorter prefixes before giving up.
    end
    nil
  end

  def fetch_upstream(query)
    uri = URI("https://duckduckgo.com/ac/?q=#{URI.encode_uri_component(query)}&type=json")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.open_timeout = UPSTREAM_TIMEOUT
    http.read_timeout = UPSTREAM_TIMEOUT
    req = Net::HTTP::Get.new(uri.request_uri, {
      "Accept" => "application/json",
      # DDG throttles default fetch/libcurl UAs; a browser UA is far faster.
      "User-Agent" => BROWSER_UA,
      "Referer" => "https://duckduckgo.com/",
      "Accept-Language" => "en-US,en;q=0.9",
    })
    res = http.request(req)
    raise "upstream #{res.code}" unless res.is_a?(Net::HTTPSuccess)
    data = JSON.parse(res.body)
    return [] unless data.is_a?(Array)
    data.filter_map do |item|
      phrase = item.is_a?(String) ? item : item["phrase"]
      phrase.presence
    end[0, MAX_SUGGESTIONS]
  end

  def get_or_fetch(query)
    task = INFLIGHT_MUTEX.synchronize { INFLIGHT[query] }
    return task.value if task

    future = ConcurrentFuture.new { fetch_upstream(query) }
    INFLIGHT_MUTEX.synchronize { INFLIGHT[query] = future }
    begin
      suggestions = future.value
      cache_put(query, suggestions, suggestions.empty? ? TTL_NEGATIVE : TTL_POSITIVE)
      suggestions
    rescue => e
      Rails.logger.error("Error fetching suggestions: #{e.message}")
      # Serve a stale prefix-filtered fallback instead of a blank list when
      # the upstream blips mid-word.
      prefix_hit(query) || []
    ensure
      INFLIGHT_MUTEX.synchronize { INFLIGHT.delete(query) }
    end
  end

  # Minimal future without extra gems: runs the block on first #value call
  # in the calling thread when created from a request, or in a background
  # thread when explicitly used. Here every caller wants the value now, so
  # this simply executes inline while still giving prefix-fallback callers
  # a shared object to coalesce on.
  class ConcurrentFuture
    def initialize(&block)
      @mutex = Mutex.new
      @block = block
      @done = false
    end

    def value
      @mutex.synchronize do
        unless @done
          begin
            @result = @block.call
          rescue => e
            @error = e
          end
          @done = true
        end
        raise @error if @error
        @result
      end
    end
  end
end
