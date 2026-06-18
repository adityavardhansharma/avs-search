// Get DOM elements
const searchInput = document.getElementById("search-input");
const suggestionsContainer = document.getElementById("suggestions");
const searchBtn = document.getElementById("search-btn");

const engineSelectorContainer = document.getElementById("engine-selector-container");
const engineSelectorMain = document.getElementById("engine-selector-main");
const currentEngineIcon = document.getElementById("current-engine-icon");
const engineOptions = document.getElementById("engine-options");
const engineOptionButtons = document.querySelectorAll(".engine-option");

// Mobile circular modal elements
const circularModal = document.getElementById("engine-circular-modal");
const centerEngineIcon = document.getElementById("center-engine-icon");

// Mobile detection
function isMobileDevice() {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Pro+ elements
const proPlusToggle = document.getElementById("pro-plus-toggle");
const proPlusIndicator = document.getElementById("pro-plus-indicator");

// Global state
let suggestionsData = [];
let activeIndex = -1;
let currentEngine = "web";
let isProPlusActive = false; // Initialize Pro+ mode as disabled
let isGeminiActive = false; // Initialize Gemini AI mode as disabled
let clientCache = {}; // Cache for suggestions
let controller = null; // AbortController for fetch requests

function clearSuggestions() {
    suggestionsContainer.innerHTML = "";
    suggestionsData = [];
    activeIndex = -1;
}

const engines = {
    web: {
        icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M9.83824 18.4467C10.0103 18.7692 10.1826 19.0598 10.3473 19.3173C8.59745 18.9238 7.07906 17.9187 6.02838 16.5383C6.72181 16.1478 7.60995 15.743 8.67766 15.4468C8.98112 16.637 9.40924 17.6423 9.83824 18.4467ZM11.1618 17.7408C10.7891 17.0421 10.4156 16.1695 10.1465 15.1356C10.7258 15.0496 11.3442 15 12.0001 15C12.6559 15 13.2743 15.0496 13.8535 15.1355C13.5844 16.1695 13.2109 17.0421 12.8382 17.7408C12.5394 18.3011 12.2417 18.7484 12 19.0757C11.7583 18.7484 11.4606 18.3011 11.1618 17.7408ZM9.75 12C9.75 12.5841 9.7893 13.1385 9.8586 13.6619C10.5269 13.5594 11.2414 13.5 12.0001 13.5C12.7587 13.5 13.4732 13.5593 14.1414 13.6619C14.2107 13.1384 14.25 12.5841 14.25 12C14.25 11.4159 14.2107 10.8616 14.1414 10.3381C13.4732 10.4406 12.7587 10.5 12.0001 10.5C11.2414 10.5 10.5269 10.4406 9.8586 10.3381C9.7893 10.8615 9.75 11.4159 9.75 12ZM8.38688 10.0288C8.29977 10.6478 8.25 11.3054 8.25 12C8.25 12.6946 8.29977 13.3522 8.38688 13.9712C7.11338 14.3131 6.05882 14.7952 5.24324 15.2591C4.76698 14.2736 4.5 13.168 4.5 12C4.5 10.832 4.76698 9.72644 5.24323 8.74088C6.05872 9.20472 7.1133 9.68686 8.38688 10.0288ZM10.1465 8.86445C10.7258 8.95042 11.3442 9 12.0001 9C12.6559 9 13.2743 8.95043 13.8535 8.86447C13.5844 7.83055 13.2109 6.95793 12.8382 6.2592C12.5394 5.69894 12.2417 5.25156 12 4.92432C11.7583 5.25156 11.4606 5.69894 11.1618 6.25918C10.7891 6.95791 10.4156 7.83053 10.1465 8.86445ZM15.6131 10.0289C15.7002 10.6479 15.75 11.3055 15.75 12C15.75 12.6946 15.7002 13.3521 15.6131 13.9711C16.8866 14.3131 17.9412 14.7952 18.7568 15.2591C19.233 14.2735 19.5 13.1679 19.5 12C19.5 10.8321 19.233 9.72647 18.7568 8.74093C17.9413 9.20477 16.8867 9.6869 15.6131 10.0289ZM17.9716 7.46178C17.2781 7.85231 16.39 8.25705 15.3224 8.55328C15.0189 7.36304 14.5908 6.35769 14.1618 5.55332C13.9897 5.23077 13.8174 4.94025 13.6527 4.6827C15.4026 5.07623 16.921 6.08136 17.9716 7.46178ZM8.67765 8.55325C7.61001 8.25701 6.7219 7.85227 6.02839 7.46173C7.07906 6.08134 8.59745 5.07623 10.3472 4.6827C10.1826 4.94025 10.0103 5.23076 9.83823 5.5533C9.40924 6.35767 8.98112 7.36301 8.67765 8.55325ZM15.3224 15.4467C15.0189 16.637 14.5908 17.6423 14.1618 18.4467C13.9897 18.7692 13.8174 19.0598 13.6527 19.3173C15.4026 18.9238 16.921 17.9186 17.9717 16.5382C17.2782 16.1477 16.3901 15.743 15.3224 15.4467ZM12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" fill="#60a5fa"/>
            </svg>`,
        bang: ""
    },
    reddit: {
        icon: `<svg fill="#60a5fa" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6">
              <path d="M12.606 20.986c-0.225 0.001-0.407 0.183-0.407 0.408 0 0.112 0.045 0.214 0.118 0.288l0-0c0.952 0.716 2.155 1.146 3.457 1.146 0.085 0 0.17-0.002 0.255-0.006l-0.012 0c0.081 0.004 0.175 0.006 0.27 0.006 1.294 0 2.488-0.431 3.445-1.158l-0.014 0.010c0.077-0.081 0.124-0.19 0.124-0.311 0-0.101-0.033-0.194-0.089-0.269l0.001 0.001c-0.074-0.074-0.177-0.119-0.29-0.119s-0.215 0.045-0.29 0.119l0-0c-0.799 0.575-1.798 0.919-2.877 0.919-0.092 0-0.184-0.003-0.275-0.007l0.013 0.001c-0.082 0.005-0.178 0.008-0.274 0.008-1.075 0-2.070-0.345-2.88-0.93l0.014 0.010c-0.074-0.073-0.175-0.119-0.287-0.119-0.001 0-0.002 0-0.003 0h0zM19.436 16c-0.861 0.001-1.56 0.699-1.56 1.561s0.699 1.561 1.561 1.561 1.561-0.699 1.561-1.561v0c-0.002-0.862-0.7-1.56-1.562-1.561h-0zM12.563 16c0.861 0 1.56 0.699 1.56 1.56s-0.699 1.56-1.56 1.56-1.56-0.699-1.56-1.56c0-0.861 0.698-1.56 1.56-1.56h0zM22.261 6.933c0.852 0.006 1.54 0.698 1.54 1.551 0 0.857-0.694 1.551-1.551 1.551-0.828 0-1.505-0.65-1.549-1.467l-0-0.004-3.245-0.684-1 4.682c2.185 0.049 4.201 0.737 5.878 1.884l-0.037-0.024c0.38-0.379 0.905-0.614 1.485-0.614 0.008 0 0.017 0 0.025 0h-0.001c1.21 0.001 2.191 0.982 2.192 2.192v0c-0.007 0.88-0.513 1.64-1.249 2.011l-0.013 0.006c0.033 0.191 0.052 0.412 0.052 0.637 0 0.005 0 0.009-0 0.014v-0.001c0 3.367-3.911 6.086-8.752 6.086s-8.752-2.719-8.752-6.086c0-0.001 0-0.003 0-0.005 0-0.234 0.020-0.463 0.057-0.687l-0.003 0.024c-0.771-0.35-1.298-1.114-1.298-2.001 0-1.21 0.981-2.191 2.191-2.191 0 0 0.001 0 0.001 0h-0c0.586 0.006 1.116 0.238 1.509 0.613l-0.001-0.001c1.66-1.148 3.711-1.841 5.924-1.858l0.004-0 1.106-5.226c0.028-0.103 0.090-0.189 0.173-0.245l0.002-0.001c0.063-0.037 0.139-0.059 0.22-0.059 0.027 0 0.054 0.003 0.080 0.007l-0.003-0 3.631 0.771c0.247-0.522 0.77-0.876 1.375-0.876 0.003 0 0.007 0 0.010 0h-0.001zM16 1.004c0 0 0 0-0 0-8.282 0-14.996 6.714-14.996 14.996s6.714 14.996 14.996 14.996c8.282 0 14.996-6.714 14.996-14.996 0-4.141-1.678-7.89-4.392-10.604v0c-2.714-2.714-6.463-4.392-10.604-4.392v0z"></path>
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
    },
    "ai-with-search": {
        icon: `<svg fill="#60a5fa" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 256 241" class="h-6 w-6">
            <path d="M254,188V2H2v186h111v29H75v22h106v-22h-38v-29H254z M19,19h217v151H19L19,19z M179.966,61.995 c-1.298-2.503-2.874-4.264-4.728-5.284c-0.093-2.688-1.298-4.913-3.245-6.86c-2.318-2.318-5.377-3.523-8.714-3.523 c-3.801-4.45-13.071-7.138-20.766-5.933c-3.801-1.854-8.714-1.761-12.051-1.761c-0.464,0-0.834,0-1.298,0h-0.464 c-3.986,0-10.939-0.093-14.74,3.245c-3.708-1.483-9.548-0.834-14.276,0.556c-5.84,1.854-9.919,4.728-11.402,8.158 c-3.801,0.927-8.621,4.357-11.495,8.529c-2.225,3.245-4.357,8.158-2.41,14.276c-2.225,5.748-1.02,11.959,3.245,16.872 c4.357,5.099,10.939,7.324,16.779,5.748c3.245,0.371,5.655,0.185,7.324-0.185c0.371,2.874,1.483,6.582,4.728,9.178 c1.298,2.966,3.801,5.191,7.045,6.118c3.708,1.02,7.787,0.371,10.846-1.761c1.112-0.093,2.41-0.185,3.801-0.464 c-0.185,2.318,0,4.45,0.556,6.304c0.185,1.947,1.947,12.422,12.33,17.428c10.568,5.099,10.105,8.158,10.105,9.085 c0,3.059,3.523,4.821,7.045,4.913c0.093,0,0.185,0,0.464,0c3.523,0,6.118-1.947,6.304-4.821c0.464-6.118-0.556-7.231-5.006-12.422 c-1.483-1.761-2.41-4.821-2.967-6.86c2.039-0.464,3.894-1.112,5.655-2.039c2.688,0,5.284-1.02,7.231-2.967 c1.947-1.947,3.059-4.357,3.245-7.138c6.304-4.357,9.456-14.091,7.602-23.917C183.674,79.608,183.303,68.762,179.966,61.995z M169.861,106.956c-0.834,0.464-1.298,1.298-1.112,2.039c0.093,1.947-0.556,3.801-1.854,5.099c-1.112,1.112-2.688,1.761-4.172,1.761 c-6.118-2.318-5.84-7.231-5.748-7.787c0.093-1.298-0.834-2.41-2.039-2.503s-2.41,0.834-2.503,2.039 c-0.371,2.41,0.464,7.045,4.635,10.383c-2.874,0.834-6.582,1.112-11.495,1.112c-5.562,0-9.27-1.112-11.124-3.523 c-1.391-1.761-1.761-4.264-1.112-7.324c6.767-1.298,8.992,1.854,9.085,2.039c0.464,0.649,1.112,1.112,1.947,1.112 c0.371,0,0.834-0.093,1.112-0.371c1.112-0.556,1.483-2.039,0.927-3.059c-0.093-0.185-3.986-6.675-15.389-3.986l0,0 c-2.318,0.464-4.357,0.649-6.118,0.834c-4.913-5.84-1.391-10.012-0.927-10.475c0.927-0.927,0.834-2.41-0.093-3.245 c-0.927-0.927-2.41-0.834-3.245,0c-2.41,2.41-5.099,8.621-0.185,15.389c-1.576,0.556-3.523,0.649-5.191,0.185 c-1.483-0.464-3.337-1.391-4.264-3.894c-0.093-0.464-0.464-0.834-0.834-1.02c-4.172-3.059-3.523-8.714-3.43-9.641 c0.834-2.318,3.337-7.509,10.475-9.548c3.245-0.927,5.84-0.371,9.085,0.185c0.927,0.185,1.947,0.371,2.966,0.556 c1.112,8.251,9.919,11.402,10.197,11.588c0.185,0.093,0.464,0.093,0.834,0.093c0.927,0,1.854-0.556,2.225-1.483 c0.464-1.112-0.185-2.503-1.391-2.874c-0.093,0-5.655-2.039-7.045-6.86c7.602-0.185,10.383-5.933,10.661-9.085 c0.093-1.298-0.649-2.41-1.947-2.503c-1.298-0.093-2.41,0.649-2.503,1.947c-0.093,0.464-0.927,5.099-6.675,5.099 c-2.318,0-4.357-0.464-6.304-0.834c-3.43-0.649-7.045-1.391-11.217-0.093c-5.284,1.483-8.621,4.45-10.661,7.231 c-1.483-2.039-3.708-3.337-5.562-4.357c-1.298-0.649-2.503-1.391-3.337-2.318c-2.039-2.039,0.371-6.304,0.371-6.304 c0.649-1.02,0.371-2.503-0.834-3.059c-1.391-1.02-2.781-0.649-3.43,0.464c-1.576,2.781-3.43,8.251,0.371,12.051 c1.298,1.298,2.874,2.225,4.357,2.966c3.059,1.761,4.821,2.874,4.821,5.84c-0.556,0.371-2.318,1.298-7.324,0.649 c-0.371,0-0.556,0-0.927,0.093c-4.264,1.298-9.085-0.464-12.515-4.264c-3.337-3.801-4.172-8.621-2.225-12.886 c0.185-0.556,0.185-1.112,0-1.761c-1.761-4.635-0.093-8.436,1.576-10.939c1.483-2.225,3.523-3.894,5.284-5.099 c0.556,0.371,1.112,0.464,1.854,0.371c5.84-1.483,9.734,5.284,10.012,5.655c0.464,0.834,1.112,1.112,1.947,1.112 c0.371,0,0.834-0.093,1.112-0.371c1.112-0.556,1.483-2.039,0.927-3.059c-0.185-0.371-3.43-6.118-9.178-7.787 c0.834-2.225,3.986-4.357,8.621-5.748c5.933-1.854,10.661-1.391,11.681-0.556c3.523,5.099,1.391,7.972-1.391,11.588 c-0.556,0.834-1.112,1.483-1.761,2.318c-4.635,6.86-1.298,12.051,1.298,13.905c0.464,0.371,0.927,0.464,1.391,0.464 c0.649,0,1.391-0.371,1.854-0.927c0.834-1.02,0.556-2.41-0.464-3.245c-0.556-0.464-3.337-2.967-0.093-7.694 c0.464-0.649,1.02-1.391,1.483-2.039c2.688-3.43,6.675-8.529,2.41-15.667c2.688-1.854,8.714-1.854,11.217-1.761h0.464 c0.371,0,0.834,0,1.298,0c3.059,0,7.787,0,10.568,1.483c0.464,0.185,1.02,0.371,1.576,0.185c6.582-1.298,13.998,1.298,16.779,3.894 c-1.298,2.503-3.43,8.158-2.225,13.442c1.391,6.211,1.576,7.787-3.43,9.641c-1.112,0.464-1.854,1.761-1.391,2.967 c0.371,0.927,1.298,1.483,2.225,1.483c0.185,0,0.556,0,0.834-0.093c3.337-1.298,5.284-2.874,6.304-4.728 c0.556,0.185,0.927,0.556,1.298,1.02c1.576,2.039,1.391,5.84,1.298,7.138c-0.185,1.298,0.649,2.41,1.947,2.688 c0.093,0,0.185,0,0.371,0c1.112,0,2.039-0.834,2.318-1.947c0.093-0.649,0.927-6.675-2.225-10.661 c-1.02-1.391-2.41-2.318-3.986-2.874c-0.093-1.854-0.464-3.801-0.927-5.748c-0.927-3.986,0.927-8.529,1.854-10.475 c2.039,0.093,3.894,0.927,5.284,2.225c1.391,1.391,1.947,3.245,1.854,5.099c-0.093,1.112,0.649,2.318,1.854,2.503 c1.112,0.185,2.41,1.483,3.337,3.43c2.688,5.377,2.966,14.74,0.834,20.209c0,0.093-0.093,0.093-0.093,0.093 c-2.039,2.966-4.728,3.059-9.178,3.059c-1.483,0-2.874,0-4.45,0.093c-7.045,0.649-10.383,7.694-10.475,8.065 c-0.556,1.112,0,2.503,1.112,3.059c0.371,0.093,0.649,0.185,0.927,0.185c0.927,0,1.761-0.464,2.039-1.391 c0,0,2.41-4.913,6.767-5.377c1.298-0.093,2.688-0.093,3.986-0.093c3.059,0,6.397,0,9.27-1.576 C177.092,97.685,174.496,104.36,169.861,106.956z M148.817,63.292c0.556,1.205,0.185,2.596-0.834,3.245 c-0.278,0.278-0.649,0.371-1.112,0.371c-0.834,0-1.483-0.371-1.947-1.02c-0.093-0.185-3.523-5.469-10.105-4.357 c-0.556,0.834-1.298,1.669-2.318,2.225c-0.464,0.278-0.927,0.649-1.391,0.834c-3.986,2.41-5.377,3.43-4.913,5.933 c0.185,1.298-0.556,2.503-1.854,2.688c-0.278,0-0.371,0-0.464,0c-1.205,0-2.132-0.834-2.318-1.947 c-1.02-5.84,3.337-8.343,7.138-10.661c0.464-0.278,0.927-0.649,1.391-0.834c2.596-1.669,1.576-6.767,1.576-6.767 c-0.185-1.298,0.464-2.596,1.761-2.781c1.298-0.185,2.596,0.464,2.781,1.761c0,0.278,0.371,2.318,0.185,4.728 C142.792,56.71,147.241,60.882,148.817,63.292z"></path>
        </svg>`,
        customUrl: "https://t3.chat/new?model=gemini-2.5-flash&q=%s&search=true"
    },
    "ai-with-reason": {
        icon: `<svg fill="#60a5fa" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6"><title>OpenAI icon</title><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"></path></svg>`,
        customUrl: "https://chatgpt.com/?q=%s"
    }
};

function syncEngineIconsFromMarkup() {
    engineOptionButtons.forEach((button) => {
        const engineKey = button.dataset.engine;
        const icon = button.querySelector("svg");

        if (engineKey && icon && engines[engineKey]) {
            engines[engineKey].icon = icon.outerHTML;
        }
    });
}

// --- Engine Selector Behavior ---
// When the container is clicked, toggle the "expanded" state and update placeholder
engineSelectorContainer.addEventListener("click", (e) => {
    e.stopPropagation();
    
    // Check if mobile device
    if (isMobileDevice()) {
        openCircularModal();
        return;
    }
    
    // Desktop behavior
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
        // Show transient notification when engine is changed via click
        showTransientEngineName();
    });
});

function updateEngineIcon() {
    if (engines[currentEngine]) {
        currentEngineIcon.innerHTML = engines[currentEngine].icon;
    }
}

// Function removed as it's replaced by showTransientEngineName
function showSelectedEngineName() {
  // Empty function to maintain compatibility with existing code
  // This function is no longer needed as we're using the transient notification instead
}

// ---------------------------------------------
// 2) Cycle to the next engine in engineOptionButtons
// ---------------------------------------------
function cycleSearchEngine() {
  const buttons = Array.from(engineOptionButtons);
  const keys = buttons.map((b) => b.dataset.engine);
  let idx = keys.indexOf(currentEngine);
  idx = (idx + 1) % keys.length;
  currentEngine = keys[idx];
  updateEngineIcon();
  // showSelectedEngineName() call removed as we're using the transient notification instead
}

// --- Suggestions & Search Functionality ---
function fetchSuggestions(query) {
    if (!query || query.trim() === "") {
        clearSuggestions();
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
                clearSuggestions();
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
                clearSuggestions();
            }
            return [];
        });
}

function renderSuggestions() {
    suggestionsContainer.innerHTML = "";
    if (!searchInput.value.trim()) {
        clearSuggestions();
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
        clearSuggestions();
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

function getNavigableUrl(input) {
    const candidate = input.trim();

    if (!candidate || candidate.startsWith("!") || /\s/.test(candidate)) {
        return null;
    }

    const firstColon = candidate.indexOf(":");
    const firstDot = candidate.indexOf(".");
    const hasSchemeLikePrefix = firstColon > -1 && (firstDot === -1 || firstColon < firstDot);
    const hasProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(candidate);
    const hasLocalhost = /^localhost(?::\d+)?(?:[/?#]|$)/i.test(candidate);
    const hasIPv4 = /^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:[/?#]|$)/.test(candidate);
    const hasDomainDot = /^(?:www\.)?[^/?#.]+\.[^/?#]+(?:[/?#]|$)/i.test(candidate);

    if (hasSchemeLikePrefix && !hasProtocol && !hasLocalhost) {
        return null;
    }

    if (!hasProtocol && !hasLocalhost && !hasIPv4 && !hasDomainDot) {
        return null;
    }

    try {
        const url = new URL(hasProtocol ? candidate : `https://${candidate}`);

        if (!["http:", "https:"].includes(url.protocol)) {
            return null;
        }

        return url.href;
    } catch {
        return null;
    }
}

function performSearch(query) {
    if (!query) return;

    const navigableUrl = getNavigableUrl(query);
    if (navigableUrl) {
        window.location.href = navigableUrl;
        return;
    }

    // Check if Gemini AI mode is active
    if (isGeminiActive) {
        // Use Gemini search with udm=50 parameter
        const geminiUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&udm=50`;
        window.location.href = geminiUrl;
        return;
    }

    // Check if the current engine has a customUrl
    if (engines[currentEngine] && engines[currentEngine].customUrl) {
        // Replace %s with the encoded search query
        const url = engines[currentEngine].customUrl.replace('%s', encodeURIComponent(query));
        window.location.href = url;
        return;
    }

    // Check if Pro+ is active and we're using web search
    if (isProPlusActive && currentEngine === "web") {
        // Use Kagi search for Pro+ web searches
        const kagiUrl = `https://kagi.com/search?q=${encodeURIComponent(query)}`;
        window.location.href = kagiUrl;
        return;
    }

    if (currentEngine !== "web" && !query.startsWith("!")) {
        query = engines[currentEngine].bang + query;
    }

    // Use DuckDuckGo (unduck) for normal web searches when Pro+ is not active
    window.location.href = `https://unduck.link?q=${encodeURIComponent(query)}`;
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
        clearSuggestions();
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
        clearSuggestions();
    }
});

// ---------------------------------------------
// 3) Listen for Ctrl+K anywhere on the page
// ---------------------------------------------
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    cycleSearchEngine();
  }
});

// ---------------------------------------------
// Listen for Ctrl/Cmd+Shift+O to toggle AI mode
// ---------------------------------------------
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
    e.preventDefault();
    toggleGeminiMode();
  }
});

// ------------------------------
// 1) Make the H1/box wrapper relative
// ------------------------------
const _engineNotifyWrapper = document.querySelector(
  '.w-full.max-w-2xl.text-center.mb-12'
);
if (_engineNotifyWrapper) _engineNotifyWrapper.style.position = 'relative';

// ------------------------------
// 2) Transient pop-up for "Selected …"
// ------------------------------
let currentNoticeTimeout = null;
let currentNotice = null;

function showTransientEngineName() {
  const wrapper = _engineNotifyWrapper;
  if (!wrapper) return;
  const h1 = wrapper.querySelector('h1.metallic-text');
  const cs = getComputedStyle(h1);
  const offset = h1.offsetHeight + parseFloat(cs.marginBottom);

  // Remove any existing notification first
  if (currentNotice) {
    currentNotice.remove();
    currentNotice = null;
  }

  // Clear any pending timeouts
  if (currentNoticeTimeout) {
    clearTimeout(currentNoticeTimeout);
    currentNoticeTimeout = null;
  }

  // build the notice
  const notice = document.createElement('div');
  notice.id = 'engine-transient-notice';
  notice.textContent =
    document
      .querySelector(`.engine-option[data-engine="${currentEngine}"]`)
      .getAttribute('data-tooltip') || currentEngine;

  Object.assign(notice.style, {
    position: 'absolute',
    top:       `${offset}px`,
    left:      '50%',
    transform: 'translateX(-50%) translateY(-0.5rem)',
    opacity:   '0',
    background:'rgba(0,0,0,0.7)',
    color:     '#60a5fa',
    padding:   '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize:  '0.875rem',
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    zIndex:    '1000'
  });

  wrapper.appendChild(notice);
  currentNotice = notice;

  // fade in
  requestAnimationFrame(() => {
    notice.style.opacity = '1';
    notice.style.transform = 'translateX(-50%) translateY(0)';
  });

  // after 1.5s, fade out and remove
  currentNoticeTimeout = setTimeout(() => {
    if (notice.parentNode) { // Check if notice is still in the DOM
      notice.style.opacity = '0';
      notice.style.transform = 'translateX(-50%) translateY(-0.5rem)';
      currentNoticeTimeout = setTimeout(() => {
        if (notice.parentNode) notice.remove();
        currentNotice = null;
        currentNoticeTimeout = null;
      }, 300);
    }
  }, 1500);
}

// ------------------------------
// 3) Monkey-patch your cycleSearchEngine()
//    so it also shows our pop-up
// ------------------------------
if (typeof cycleSearchEngine === 'function') {
  const _oldCycle = cycleSearchEngine;
  cycleSearchEngine = function() {
    _oldCycle();
    showTransientEngineName();
  };
}

// ---------------------------------------------
// Gemini AI Mode Button Functionality
// ---------------------------------------------
function toggleGeminiMode() {
    isGeminiActive = !isGeminiActive;
    updateGeminiState();
    showGeminiNotification();
}

function updateGeminiState() {
    // Update the indicator visibility
    const indicator = document.getElementById('gemini-indicator');
    if (indicator) {
        indicator.style.opacity = isGeminiActive ? '1' : '0';
    }

    // Update the powered by text
    updatePoweredByText();
}

function updatePoweredByText() {
    const poweredBySpan = document.querySelector('.flex.justify-center.space-x-6 span:first-child');
    if (poweredBySpan) {
        if (isGeminiActive) {
            poweredBySpan.textContent = 'POWERED BY: AI MODE';
        } else if (isProPlusActive) {
            poweredBySpan.textContent = 'POWERED BY: KAGI SEARCH';
        } else {
            poweredBySpan.textContent = 'POWERED BY: UNDUCK';
        }
    }
}

function showModeNotification(id, message) {
    const existingNotification = document.getElementById(id);
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.id = id;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(13, 25, 45, 0.95);
        color: #60a5fa;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
        z-index: 10000;
        font-weight: 600;
        font-size: 16px;
        backdrop-filter: blur(10px);
        font-family: 'Space Grotesk', sans-serif;
        opacity: 0;
        transition: all 0.3s ease-in-out;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

function showGeminiNotification() {
    showModeNotification(
        'gemini-notification',
        isGeminiActive
            ? '🤖 AI Mode ENABLED - Using Gemini Search'
            : '🤖 AI Mode DISABLED - Using Standard Search'
    );
}

// ---------------------------------------------
// 4) Show the initial engine on page‐load
// ---------------------------------------------
window.addEventListener("load", () => {
    searchInput.setAttribute("autocomplete", "off");
    searchInput.focus();
    syncEngineIconsFromMarkup();
    updateEngineIcon();

    // Remove any existing selected-engine-display element
    const oldDisplay = document.getElementById('selected-engine-display');
    if (oldDisplay) oldDisplay.remove();

    // Set up Gemini AI mode button event listener
    const geminiBtn = document.getElementById('gemini-search-btn');
    if (geminiBtn) {
        geminiBtn.addEventListener('click', toggleGeminiMode);
        console.log('Gemini button event listener attached');
    } else {
        console.error('Gemini button not found!');
    }

    // Don't show transient notification on page load
    // Only show it when user actively changes engines

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

// Missing functions for desktop engine selector compatibility
function setSelectedEngine(engineKey) {
    currentEngine = engineKey;
    updateEngineIcon();
    showTransientEngineName();
}

function closeEngineOptions() {
    engineSelectorContainer.classList.remove('expanded');
    searchInput.setAttribute('placeholder', 'Search anything...');
}

// Event listeners for selecting the engine
document.addEventListener('click', function(event) {
  const engineOption = event.target.closest('.engine-option');
  if (engineOption) {
    const engineKey = engineOption.dataset.engine;
    if (engineKey) {
      setSelectedEngine(engineKey);
      closeEngineOptions();
    }
  }

  // Close engine options when clicking outside
  if (!event.target.closest('.engine-options') && !event.target.closest('.engine-select-button')) {
    closeEngineOptions();
  }
});

// --- Pro+ Toggle Functionality ---
proPlusToggle.addEventListener("click", (e) => {
    e.preventDefault();
    isProPlusActive = !isProPlusActive;
    updateProPlusState();
    showProPlusNotification();
});

function updateProPlusState() {
    // Update the indicator visibility
    const indicator = document.getElementById('pro-plus-indicator');
    if (indicator) {
        indicator.style.opacity = isProPlusActive ? '1' : '0';
    }

    // Update the powered by text
    updatePoweredByText();
}

function showProPlusNotification() {
    showModeNotification(
        'pro-plus-notification',
        isProPlusActive
            ? 'Pro Mode ENABLED - Using Kagi Search'
            : 'Pro Mode DISABLED - Using Unduck Search'
    );
}

// Initial state update
document.addEventListener('DOMContentLoaded', () => {
    updateProPlusState();
    updateGeminiState();
    populateMobileModalIcons(); // Populate mobile modal with correct SVGs
});

// --- Mobile Circular Engine Selector Functions ---

function openCircularModal() {
    updateCenterIcon();
    circularModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeEngineModal() {
    circularModal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

function selectEngineFromCircle(engineKey) {
    // Add selection animation
    const selectedButton = document.querySelector(`[data-engine="${engineKey}"]`);
    if (selectedButton) {
        selectedButton.classList.add('selected');
        setTimeout(() => selectedButton.classList.remove('selected'), 600);
    }
    
    // Update current engine
    currentEngine = engineKey;
    updateEngineIcon();
    updateCenterIcon();
    
    // Show transient notification
    showTransientEngineName();
    
    // Close modal after a brief delay for animation
    setTimeout(() => {
        closeEngineModal();
    }, 300);
}

function updateCenterIcon() {
    if (engines[currentEngine] && centerEngineIcon) {
        centerEngineIcon.innerHTML = engines[currentEngine].icon;
    }
}

// Populate mobile circular modal buttons with SVGs from engines object
function populateMobileModalIcons() {
    const circleOptions = document.querySelectorAll('.engine-circle-option');
    circleOptions.forEach((button) => {
        const engineKey = button.getAttribute('data-engine');
        if (engines[engineKey] && engines[engineKey].icon) {
            // Find the SVG element inside the button and replace it
            const svgElement = button.querySelector('svg');
            if (svgElement) {
                // Replace the entire SVG with the one from engines object
                svgElement.outerHTML = engines[engineKey].icon;
            }
        }
    });
}

// Close modal when clicking outside or pressing escape
document.addEventListener('click', (e) => {
    if (circularModal.classList.contains('active') && e.target === circularModal) {
        closeEngineModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && circularModal.classList.contains('active')) {
        closeEngineModal();
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    // Close desktop selector if switching to mobile
    if (isMobileDevice() && engineSelectorContainer.classList.contains('expanded')) {
        engineSelectorContainer.classList.remove('expanded');
        searchInput.setAttribute('placeholder', 'Search anything...');
    }
    
    // Close mobile modal if switching to desktop
    if (!isMobileDevice() && circularModal.classList.contains('active')) {
        closeEngineModal();
    }
});
