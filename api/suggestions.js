const axios = require('axios');

// Simple LRU cache implementation
class LRUCache {
    constructor(capacity) {
        this.capacity = capacity;
        this.cache = new Map();
    }

    get(key) {
        if (!this.cache.has(key)) return undefined;

        // Move to most recently used
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);

        return value;
    }

    put(key, value) {
        // Remove if exists
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        // Evict oldest if at capacity
        else if (this.cache.size >= this.capacity) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        // Add new entry
        this.cache.set(key, value);
    }
}

// Initialize cache
const suggestionsCache = new LRUCache(2000);

// API client with reasonable timeouts
const api = axios.create({
    timeout: 800
});

module.exports = async (req, res) => {
    const { q } = req.query;

    // Return empty array for empty query
    if (!q || q.trim() === '') {
        return res.status(200).json([]);
    }

    const query = q.trim().toLowerCase();

    // Check cache first
    const cachedResult = suggestionsCache.get(query);
    if (cachedResult) {
        return res.status(200).json(cachedResult);
    }

    try {
        const response = await api.get(
            `https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=json`
        );

        let suggestions = [];

        if (Array.isArray(response.data)) {
            suggestions = response.data
                .map(item => item.phrase || item)
                .slice(0, 10);
        }

        // Cache the result
        suggestionsCache.put(query, suggestions);

        // Return suggestions
        res.status(200).json(suggestions);
    } catch (error) {
        console.error('Error fetching suggestions:', error.message || error);
        res.status(200).json([]); // Return empty array on error
    }
};
