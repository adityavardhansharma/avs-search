// Get DOM elements
const searchInput = document.getElementById("search-input");
const suggestionsContainer = document.getElementById("suggestions");
const searchBtn = document.getElementById("search-btn");

const engineSelectorContainer = document.getElementById("engine-selector-container");
const engineSelectorMain = document.getElementById("engine-selector-main");
const currentEngineIcon = document.getElementById("current-engine-icon");
const engineOptions = document.getElementById("engine-options");
const engineOptionButtons = document.querySelectorAll(".engine-option");

let suggestionsData = [];
let activeIndex = -1;
let controller = null;
let clientCache = {};
let currentEngine = "web";

const engines = {
    web: {
        icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M9.83824 18.4467C10.0103 18.7692 10.1826 19.0598 10.3473 19.3173C8.59745 18.9238 7.07906 17.9187 6.02838 16.5383C6.72181 16.1478 7.60995 15.743 8.67766 15.4468C8.98112 16.637 9.40924 17.6423 9.83824 18.4467ZM11.1618 17.7408C10.7891 17.0421 10.4156 16.1695 10.1465 15.1356C10.7258 15.0496 11.3442 15 12.0001 15C12.6559 15 13.2743 15.0496 13.8535 15.1355C13.5844 16.1695 13.2109 17.0421 12.8382 17.7408C12.5394 18.3011 12.2417 18.7484 12 19.0757C11.7583 18.7484 11.4606 18.3011 11.1618 17.7408ZM9.75 12C9.75 12.5841 9.7893 13.1385 9.8586 13.6619C10.5269 13.5594 11.2414 13.5 12.0001 13.5C12.7587 13.5 13.4732 13.5593 14.1414 13.6619C14.2107 13.1384 14.25 12.5841 14.25 12C14.25 11.4159 14.2107 10.8616 14.1414 10.3381C13.4732 10.4406 12.7587 10.5 12.0001 10.5C11.2414 10.5 10.5269 10.4406 9.8586 10.3381C9.7893 10.8615 9.75 11.4159 9.75 12ZM8.38688 10.0288C8.29977 10.6478 8.25 11.3054 8.25 12C8.25 12.6946 8.29977 13.3522 8.38688 13.9712C7.11338 14.3131 6.05882 14.7952 5.24324 15.2591C4.76698 14.2736 4.5 13.168 4.5 12C4.5 10.832 4.76698 9.72644 5.24323 8.74088C6.05872 9.20472 7.1133 9.68686 8.38688 10.0288ZM10.1465 8.86445C10.7258 8.95042 11.3442 9 12.0001 9C12.6559 9 13.2743 8.95043 13.8535 8.86447C13.5844 7.83055 13.2109 6.95793 12.8382 6.2592C12.5394 5.69894 12.2417 5.25156 12 4.92432C11.7583 5.25156 11.4606 5.69894 11.1618 6.25918C10.7891 6.95791 10.4156 7.83053 10.1465 8.86445ZM15.6131 10.0289C15.7002 10.6479 15.75 11.3055 15.75 12C15.75 12.6946 15.7002 13.3521 15.6131 13.9711C16.8866 14.3131 17.9412 14.7952 18.7568 15.2591C19.233 14.2735 19.5 13.1679 19.5 12C19.5 10.8321 19.233 9.72647 18.7568 8.74093C17.9413 9.20477 16.8867 9.6869 15.6131 10.0289ZM17.9716 7.46178C17.2781 7.85231 16.39 8.25705 15.3224 8.55328C15.0189 7.36304 14.5908 6.35769 14.1618 5.55332C13.9897 5.23077 13.8174 4.94025 13.6527 4.6827C15.4026 5.07623 16.921 6.08136 17.9716 7.46178ZM8.67765 8.55325C7.61001 8.25701 6.7219 7.85227 6.02839 7.46173C7.07906 6.08134 8.59745 5.07623 10.3472 4.6827C10.1826 4.94025 10.0103 5.23076 9.83823 5.5533C9.40924 6.35767 8.98112 7.36301 8.67765 8.55325ZM15.3224 15.4467C15.0189 16.637 14.5908 17.6423 14.1618 18.4467C13.9897 18.7692 13.8174 19.0598 13.6527 19.3173C15.4026 18.9238 16.921 17.9186 17.9717 16.5382C17.2782 16.1477 16.3901 15.743 15.3224 15.4467ZM12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" fill="#60a5fa"/>
            </svg>`,
        bang: ""
    },
    reddit: {
        icon: `<svg fill="#60a5fa" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6">
              <path d="M12.606 20.986c-0.225 0.001-0.407 0.183-0.407 0.408 0 0.112 0.045 0.214 0.118 0.288l-0-0c0.952 0.716 2.155 1.146 3.457 1.146 0.085 0 0.17-0.002 0.255-0.006l-0.012 0c0.081 0.004 0.175 0.006 0.27 0.006 1.294 0 2.488-0.431 3.445-1.158l-0.014 0.010c0.077-0.081 0.124-0.19 0.124-0.311 0-0.101-0.033-0.194-0.089-0.269l0.001 0.001c-0.074-0.074-0.177-0.119-0.29-0.119s-0.215 0.045-0.29 0.119l0-0c-0.799 0.575-1.798 0.919-2.877 0.919-0.092 0-0.184-0.003-0.275-0.007l0.013 0.001c-0.082 0.005-0.178 0.008-0.274 0.008-1.075 0-2.070-0.345-2.88-0.93l0.014 0.010c-0.074-0.073-0.175-0.119-0.287-0.119-0.001 0-0.002 0-0.003 0h0zM19.436 16c-0.861 0.001-1.56 0.699-1.56 1.561s0.699 1.561 1.561 1.561 1.561-0.699 1.561-1.561v0c-0.002-0.862-0.7-1.56-1.562-1.561h-0zM12.563 16c0.861 0 1.56 0.699 1.56 1.56s-0.699 1.56-1.56 1.56-1.56-0.699-1.56-1.56c0-0.861 0.698-1.56 1.56-1.56h0zM22.261 6.933c0.852 0.006 1.54 0.698 1.54 1.551 0 0.857-0.694 1.551-1.551 1.551-0.828 0-1.505-0.65-1.549-1.467l-0-0.004-3.245-0.684-1 4.682c2.185 0.049 4.201 0.737 5.878 1.884l-0.037-0.024c0.38-0.379 0.905-0.614 1.485-0.614 0.008 0 0.017 0 0.025 0h-0.001c1.21 0.001 2.191 0.982 2.192 2.192v0c-0.007 0.88-0.513 1.64-1.249 2.011l-0.013 0.006c0.033 0.191 0.052 0.412 0.052 0.637 0 0.005 0 0.009-0 0.014v-0.001c0 3.367-3.911 6.086-8.752 6.086s-8.752-2.719-8.752-6.086c0-0.001 0-0.003 0-0.005 0-0.234 0.020-0.463 0.057-0.687l-0.003 0.024c-0.771-0.35-1.298-1.114-1.298-2.001 0-1.21 0.981-2.191 2.191-2.191 0 0 0.001 0 0.001 0h-0c0.586 0.006 1.116 0.238 1.509 0.613l-0.001-0.001c1.66-1.148 3.711-1.841 5.924-1.858l0.004-0 1.106-5.226c0.028-0.103 0.090-0.189 0.173-0.245l0.002-0.001c0.063-0.037 0.139-0.059 0.22-0.059 0.027 0 0.054 0.003 0.080 0.007l-0.003-0 3.631 0.771c0.247-0.522 0.77-0.876 1.375-0.876 0.003 0 0.007 0 0.010 0h-0.001zM16 1.004c0 0 0 0-0 0-8.282 0-14.996 6.714-14.996 14.996s6.714 14.996 14.996 14.996c8.282 0 14.996-6.714 14.996-14.996 0-4.141-1.678-7.89-4.392-10.604v0c-2.714-2.714-6.463-4.392-10.604-4.392v0z"></path>
            </svg>`,
        bang: "!r "
    },
    imdb: {
        icon: `<svg fill="#60a5fa" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6">
              <path d="m18.8 13.768v-1.875c0-.013.001-.028.001-.044 0-.137-.02-.27-.057-.395l.002.01q-.054-.16-.32-.16t-.268.59v.16c-.026.245-.042.529-.042.817 0 .545.054 1.077.157 1.592l-.009-.051q.054.107.24.107c.007.001.015.001.023.001.102 0 .188-.067.217-.16v-.002c.035-.125.055-.27.055-.418 0-.022 0-.043-.001-.065v.003zm-4.607-3.322c.002-.025.003-.053.003-.082 0-.163-.03-.319-.086-.463l.003.009q-.08-.16-.455-.16v4.5q.375 0 .455-.187c.052-.156.083-.336.083-.523 0-.033-.001-.065-.003-.098v.004zm9.807-7.874c0-.013 0-.029 0-.045 0-.696-.287-1.326-.749-1.776l-.001-.001c-.451-.463-1.08-.75-1.777-.75-.016 0-.031 0-.047 0h.002-18.858c-.013 0-.028 0-.044 0-.697 0-1.327.287-1.777.75l-.001.001c-.463.451-.75 1.08-.75 1.777v.046-.002 18.858.043c0 .696.287 1.326.749 1.776l.001.001c.451.463 1.08.75 1.777.75h.047-.002 18.858.045c.696 0 1.326-.287 1.776-.749l.001-.001c.463-.451.75-1.08.75-1.777 0-.015 0-.03 0-.045v.002zm-18.8 6v6.858h-1.771v-6.857zm6.054 0v6.858h-1.503v-4.661l-.64 4.661h-1.128l-.64-4.554v4.554h-1.557v-6.857h2.303q.16 1.018.429 3.161l.054.054.375-3.214zm4.66 2.41v1.446c.005.129.007.279.007.431 0 .604-.042 1.198-.122 1.779l.008-.067c-.1.383-.408.675-.794.749l-.006.001c-.548.074-1.182.116-1.825.116-.168 0-.336-.003-.502-.009l.024.001h-.8v-6.857h1.5c.068-.002.148-.004.228-.004.431 0 .852.04 1.26.118l-.042-.007c.499.108.881.509.959 1.011l.001.007c.071.296.112.636.112.985 0 .049-.001.098-.002.146v-.007zm4.608.96h-.058v1.929c.002.044.004.096.004.148 0 .35-.06.686-.17.998l.006-.021c-.179.293-.498.485-.861.485-.036 0-.072-.002-.107-.006h.004c-.011 0-.023 0-.035 0-.448 0-.852-.184-1.143-.48l-.054.429h-1.608v-6.857h1.66v2.25c.272-.314.671-.511 1.117-.511.031 0 .062.001.093.003h-.004c.031-.003.066-.005.102-.005.35 0 .658.182.833.456l.002.004c.141.288.223.626.223.984 0 .069-.003.137-.009.204l.001-.009z"></path>
            </svg>`,
        bang: "!imdb "
    },
    amazon: {
        icon: `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" 
                xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" 
                xml:space="preserve" fill="#60a5fa" class="h-6 w-6">
              <path style="fill-rule: evenodd; clip-rule: evenodd;" d="M293.596,233.97 c0,26.322,0.627,48.264-12.651,71.65c-10.724,19.022-27.791,30.698-46.749,30.698c-25.905,0-41.069-19.73-41.069-48.979 c0-57.525,51.607-67.983,100.469-67.983V233.97z M361.701,398.655c-4.48,4.005-10.934,4.283-15.971,1.567 c-22.446-18.64-26.462-27.263-38.718-45.009c-37.07,37.767-63.335,49.094-111.356,49.094c-56.871,0-101.09-35.085-101.09-105.269 c0-54.833,29.688-92.112,72.023-110.394c36.647-16.086,87.836-19.004,127.006-23.397v-8.774c0-16.074,1.253-35.091-8.218-48.979 c-8.217-12.43-24.013-17.542-37.905-17.542c-25.76,0-48.67,13.196-54.288,40.552c-1.178,6.094-5.612,12.11-11.745,12.425 l-65.459-7.092c-5.524-1.241-11.676-5.682-10.074-14.119c15.036-79.421,86.762-103.418,151.037-103.418 c32.857,0,75.823,8.774,101.729,33.63c32.857,30.71,29.7,71.65,29.7,116.248v105.223c0,31.65,13.138,45.543,25.487,62.615 c4.317,6.128,5.292,13.44-0.209,17.92c-13.8,11.571-38.324,32.869-51.811,44.87L361.701,398.655z M454.261,417.377 c-62.721,26.602-130.884,39.461-192.884,39.461c-91.933,0-180.924-25.209-252.882-67.096c-6.302-3.668-10.968,2.797-5.733,7.532 c66.702,60.236,154.845,96.425,252.732,96.425c69.846,0,150.949-21.971,206.903-63.254 C471.646,423.598,463.72,413.361,454.261,417.377z M470.962,467.655c-2.043,5.106,2.345,7.172,6.964,3.296 c30.014-25.116,37.767-77.716,31.615-85.317c-6.093-7.532-58.565-14.021-90.599,8.461c-4.921,3.481-4.062,8.24,1.394,7.59 c18.036-2.17,58.182-6.986,65.343,2.183C492.828,413.036,477.717,450.779,470.962,467.655z"></path>
            </svg>`,
        bang: "!ain "
    },
    youtube: {
        icon: `<svg fill="#60a5fa" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6">
              <path d="M24.325 8.309s-2.655-.334-8.357-.334c-5.517 0-8.294.334-8.294.334A2.675 2.675 0 0 0 5 10.984v10.034a2.675 2.675 0 0 0 2.674 2.676s2.582.332 8.294.332c5.709 0 8.357-.332 8.357-.332A2.673 2.673 0 0 0 27 21.018V10.982a2.673 2.673 0 0 0-2.675-2.673zM13.061 19.975V12.03L20.195 16l-7.134 3.975z"></path>
            </svg>`,
        bang: "!yt "
    },
    ai: {
        icon: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="#60a5fa" class="h-6 w-6">
              <g id="Layer_2" data-name="Layer 2">
                <g id="invisible_box" data-name="invisible box">
                  <rect width="48" height="48" fill="none"></rect>
                </g>
                <g id="Q3_icons" data-name="Q3 icons">
                  <g>
                    <path d="M17.9,2h-.4L7.6,6.6a1,1,0,0,0-.6.9v7.4l-.6.5-4,3.3a.8.8,0,0,0-.4.8v9a.9.9,0,0,0,.4.8l4,3.3.6.5v7.4a1,1,0,0,0,.6.9l9.9,4.5h.4l.6-.2,4-2.7V25.5H21a1.5,1.5,0,0,1,0-3h1.5V4.9l-4-2.7ZM9,13.5l2.8,1.9a1.5,1.5,0,0,1,.4,2.1,1.4,1.4,0,0,1-1.2.7,1.1,1.1,0,0,1-.8-.3L9,17.1Zm-5,9H7.5a1.5,1.5,0,0,1,0,3H4Zm5,8.4,1.2-.8a1.4,1.4,0,0,1,2,.4,1.5,1.5,0,0,1-.4,2.1L9,34.5ZM19.5,18.6l-4,4v2.8l4,4v5.2l-3.4,3.5a2.1,2.1,0,0,1-1.1.4,2.1,2.1,0,0,1-1.1-.4,1.6,1.6,0,0,1,0-2.2l2.6-2.5V30.6l-4-4V21.4l4-4V14.6l-2.6-2.5a1.6,1.6,0,1,1,2.2-2.2l3.4,3.5Z"></path>
                    <path d="M45.6,18.7l-4-3.3-.6-.5V7.5a1,1,0,0,0-.6-.9L30.5,2.1h-.4l-.6.2-4,2.7V22.5H27a1.5,1.5,0,0,1,0,3H25.5V43.1l4,2.7.6.2h.4l9.9-4.5a1,1,0,0,0,.6-.9V33.1l.6-.5,4-3.3a.9.9,0,0,0,.4-.8v-9A.8.8,0,0,0,45.6,18.7ZM39,17.1l-1.2.8a1.1,1.1,0,0,1-.8.3,1.4,1.4,0,0,1-1.2-.7,1.5,1.5,0,0,1,.4-2.1L39,13.5ZM28.5,29.4l4-4V22.6l-4-4V13.4l3.4-3.5a1.6,1.6,0,0,1,2.2,2.2l-2.6,2.5v2.8l4,4v5.2l-4,4v2.8l2.6,2.5a1.6,1.6,0,0,1,0,2.2,1.7,1.7,0,0,1-2.2,0l-3.4-3.5ZM39,34.5l-2.8-1.9a1.5,1.5,0,0,1-.4-2.1,1.4,1.4,0,0,1,2-.4l1.2.8Zm5-9H40.5a1.5,1.5,0,0,1,0-3H44Z"></path>
                  </g>
                </g>
              </g>
            </svg>`,
        bang: "!t3 "
    }
};

// --- Engine Selector Behavior ---
// When the container is clicked, toggle the "expanded" state and update placeholder
engineSelectorContainer.addEventListener("click", (e) => {
    e.stopPropagation();
    engineSelectorContainer.classList.toggle("expanded");
    if (engineSelectorContainer.classList.contains("expanded")) {
        searchInput.setAttribute("placeholder", "Choose Engine");
    } else {
        searchInput.setAttribute("placeholder", "Search anything...");
    }
});

// When an option is clicked, update the main icon, collapse the container,
// and update the placeholder back to "Search anything..."
engineOptionButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
        e.stopPropagation();
        currentEngine = button.dataset.engine;
        updateEngineIcon();
        engineSelectorContainer.classList.remove("expanded");
        searchInput.setAttribute("placeholder", "Search anything...");
    });
});

function updateEngineIcon() {
    if (engines[currentEngine]) {
        currentEngineIcon.innerHTML = engines[currentEngine].icon;
    }
}

// --- Suggestions & Search Functionality ---
function fetchSuggestions(query) {
    if (!query || query.trim() === "") {
        suggestionsContainer.innerHTML = "";
        suggestionsData = [];
        return Promise.resolve([]);
    }
    if (clientCache[query]) {
        suggestionsData = clientCache[query];
        renderSuggestions();
        return Promise.resolve(suggestionsData);
    }
    if (controller) {
        controller.abort();
    }
    controller = new AbortController();
    suggestionsContainer.innerHTML = "";
    return fetch(`/api/suggestions?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
        headers: { "X-Requested-With": "XMLHttpRequest" }
    })
        .then((response) => response.json())
        .then((data) => {
            if (searchInput.value.trim() !== query) return [];
            if (!searchInput.value.trim()) {
                suggestionsContainer.innerHTML = "";
                suggestionsData = [];
                return [];
            }
            suggestionsData = Array.isArray(data) ? data : [];
            clientCache[query] = suggestionsData;
            activeIndex = -1;
            renderSuggestions();
            return suggestionsData;
        })
        .catch((error) => {
            if (error.name !== "AbortError") {
                console.error("Error fetching suggestions:", error);
                suggestionsData = [];
                suggestionsContainer.innerHTML = "";
            }
            return [];
        });
}

function renderSuggestions() {
    suggestionsContainer.innerHTML = "";
    if (!searchInput.value.trim()) {
        suggestionsData = [];
        return;
    }
    if (!suggestionsData.length) return;
    const fragment = document.createDocumentFragment();
    suggestionsData.forEach((suggestion) => {
        const element = document.createElement("div");
        element.className =
            "suggestion p-2 cursor-pointer hover:bg-blue-900/70 transition-colors";
        element.textContent = suggestion;
        element.onclick = () => {
            searchInput.value = suggestion;
            performSearch(suggestion);
        };
        fragment.appendChild(element);
    });
    suggestionsContainer.appendChild(fragment);
}

function handleInput() {
    const query = searchInput.value.trim();
    if (!query) {
        suggestionsContainer.innerHTML = "";
        suggestionsData = [];
        return;
    }
    window.requestAnimationFrame(() => {
        fetchSuggestions(query);
    });
}

function updateActiveSuggestion() {
    const suggestionElements = suggestionsContainer.querySelectorAll(
        ".suggestion"
    );
    suggestionElements.forEach((element, index) => {
        if (index === activeIndex) {
            element.classList.add("active");
        } else {
            element.classList.remove("active");
        }
    });
}

function performSearch(query) {
    if (!query) return;
    if (currentEngine !== "web" && !query.startsWith("!")) {
        query = engines[currentEngine].bang + query;
    }
    const isURLLike = query.includes(".") && !query.startsWith("!");
    // A more robust URL test pattern:
    const domainPattern =
        /^(www\.)?[a-zA-Z0-9][-a-zA-Z0-9@:%._+~#=]{0,256}\.[a-zA-Z0-9()]{1,}(\.[a-zA-Z0-9()]{1,})*$/i;
    if (isURLLike && domainPattern.test(query)) {
        const url =
            query.startsWith("http://") || query.startsWith("https://")
                ? query
                : "https://" + query;
        window.location.href = url;
    } else {
        window.location.href = `https://unduck.link?q=${encodeURIComponent(query)}`;
    }
}

// --- Event Listeners ---
searchInput.addEventListener("input", handleInput);
searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestionsData.length) {
            searchInput.value = suggestionsData[activeIndex];
        }
        performSearch(searchInput.value.trim());
        return;
    }
    const suggestionElements = suggestionsContainer.querySelectorAll(
        ".suggestion"
    );
    if (!suggestionElements.length) return;
    if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % suggestionElements.length;
        updateActiveSuggestion();
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex =
            activeIndex <= 0 ? suggestionElements.length - 1 : activeIndex - 1;
        updateActiveSuggestion();
    } else if (e.key === "Escape") {
        e.preventDefault();
        suggestionsContainer.innerHTML = "";
        suggestionsData = [];
    }
});

searchBtn.addEventListener("click", () => {
    performSearch(searchInput.value.trim());
});

document.addEventListener("click", (e) => {
    if (
        !searchInput.contains(e.target) &&
        !suggestionsContainer.contains(e.target)
    ) {
        suggestionsContainer.innerHTML = "";
        suggestionsData = [];
    }
});

window.addEventListener("load", () => {
    searchInput.setAttribute("autocomplete", "off");
    searchInput.focus();
    updateEngineIcon();
    // Prefetch common suggestions
    setTimeout(() => {
        ["a", "how", "what", "why","cricbuzz"].forEach((term) => {
            fetch(`/api/suggestions?q=${term}`)
                .then((response) => response.json())
                .then((data) => {
                    if (Array.isArray(data)) {
                        clientCache[term] = data;
                    }
                })
                .catch(() => {});
        });
    }, 1000);
});
