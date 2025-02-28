const searchInput = document.getElementById("search-input");
const suggestionsContainer = document.getElementById("suggestions");
const searchBtn = document.getElementById("search-btn");
let suggestionsData = [];
let activeIndex = -1;
let controller = null;
let clientCache = {}; // Client-side cache

// Fetch suggestions with optimized handling
function fetchSuggestions(query) {
    // Clear suggestions for empty query
    if (!query || query.trim() === "") {
        suggestionsContainer.innerHTML = "";
        suggestionsData = [];
        return Promise.resolve([]);
    }

    // Check client-side cache first (instant response)
    if (clientCache[query]) {
        suggestionsData = clientCache[query];
        renderSuggestions();
        return Promise.resolve(suggestionsData);
    }

    // Cancel any ongoing request
    if (controller) {
        controller.abort();
    }

    // Create new controller
    controller = new AbortController();

    // IMPORTANT: Don't show any placeholders, just clear previous content
    // This fixes the "weird boxes" issue
    suggestionsContainer.innerHTML = '';

    // Fetch suggestions
    return fetch(`/api/suggestions?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
        .then(response => response.json())
        .then(data => {
            // Check if input is still the same (prevents race conditions)
            if (searchInput.value.trim() !== query) return [];

            // Check again if input is empty now
            if (!searchInput.value.trim()) {
                suggestionsContainer.innerHTML = "";
                suggestionsData = [];
                return [];
            }

            if (Array.isArray(data)) {
                suggestionsData = data;
            } else {
                suggestionsData = [];
            }

            // Store in client-side cache
            clientCache[query] = suggestionsData;

            // Reset active index and render
            activeIndex = -1;
            renderSuggestions();
            return suggestionsData;
        })
        .catch(error => {
            if (error.name !== 'AbortError') {
                console.error("Error fetching suggestions:", error);
                suggestionsData = [];
                suggestionsContainer.innerHTML = "";
            }
            return [];
        });
}

// Clean, fast rendering with no placeholders
function renderSuggestions() {
    // Clear container
    suggestionsContainer.innerHTML = "";

    // Extra check for empty input
    if (!searchInput.value.trim()) {
        suggestionsData = [];
        return;
    }

    // If no suggestions, keep container empty
    if (!suggestionsData.length) {
        return;
    }

    // Create fragment for batch update
    const fragment = document.createDocumentFragment();

    // Add each suggestion
    suggestionsData.forEach((suggestion, index) => {
        const element = document.createElement("div");
        element.className = "suggestion";
        element.textContent = suggestion;

        // Use faster direct property assignment
        element.onclick = () => {
            searchInput.value = suggestion;
            performSearch(suggestion);
        };

        fragment.appendChild(element);
    });

    // Batch DOM update
    suggestionsContainer.appendChild(fragment);
}

// Optimized input handler with minimal delay
function handleInput() {
    const query = searchInput.value.trim();

    // Clear immediately for empty
    if (!query) {
        suggestionsContainer.innerHTML = "";
        suggestionsData = [];
        return;
    }

    // Use requestAnimationFrame for better performance
    window.requestAnimationFrame(() => {
        fetchSuggestions(query);
    });
}

// Update active suggestion
function updateActiveSuggestion() {
    const suggestionElements = suggestionsContainer.querySelectorAll(".suggestion");

    suggestionElements.forEach((element, index) => {
        if (index === activeIndex) {
            element.classList.add("active");
        } else {
            element.classList.remove("active");
        }
    });
}

// Perform search or open URL directly
function performSearch(query) {
    if (!query) return;

    // Better URL detection pattern - works with all TLDs
    // This improved pattern doesn't restrict TLD length and works with multi-part TLDs
    const isURLLike = query.includes('.');

    // Check for domain pattern more thoroughly
    const domainPattern = /^(www\.)?[a-zA-Z0-9][-a-zA-Z0-9@:%._+~#=]{0,256}\.[a-zA-Z0-9()]{1,}(\.[a-zA-Z0-9()]{1,})*$/i;

    if (isURLLike && domainPattern.test(query)) {
        // If it's a URL, open it directly
        // Add https:// if not already present
        const url = query.startsWith('http://') || query.startsWith('https://')
            ? query
            : 'https://' + query;

        window.location.href = url;
    } else {
        // If not a URL, proceed with regular search
        window.location.href = `https://unduck.link?q=${encodeURIComponent(query)}`;
    }
}

// Input event with minimal overhead
searchInput.addEventListener("input", handleInput);

// Keyboard navigation
searchInput.addEventListener("keydown", (e) => {
    // Handle Enter
    if (e.key === "Enter") {
        e.preventDefault();

        if (activeIndex >= 0 && activeIndex < suggestionsData.length) {
            searchInput.value = suggestionsData[activeIndex];
        }

        performSearch(searchInput.value.trim());
        return;
    }

    // Handle navigation keys
    const suggestionElements = suggestionsContainer.querySelectorAll(".suggestion");
    if (!suggestionElements.length) return;

    if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % suggestionElements.length;
        updateActiveSuggestion();
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = activeIndex <= 0 ? suggestionElements.length - 1 : activeIndex - 1;
        updateActiveSuggestion();
    } else if (e.key === "Escape") {
        e.preventDefault();
        suggestionsContainer.innerHTML = "";
        suggestionsData = [];
    }
});

// Search button click
searchBtn.addEventListener("click", () => {
    performSearch(searchInput.value.trim());
});

// Close suggestions when clicking outside
document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
        suggestionsContainer.innerHTML = "";
        suggestionsData = [];
    }
});

// Focus on load and prefetch common queries
window.addEventListener('load', () => {
    searchInput.setAttribute('autocomplete', 'off');
    searchInput.focus();

    // Prefetch common queries in background
    setTimeout(() => {
        ['a', 'how', 'what', 'why'].forEach(term => {
            fetch(`/api/suggestions?q=${term}`)
                .then(response => response.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        clientCache[term] = data;
                    }
                })
                .catch(() => {});
        });
    }, 1000);
});
