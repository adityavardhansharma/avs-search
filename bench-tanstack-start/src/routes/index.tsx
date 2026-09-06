import { useEffect } from 'react';
import { engines } from '../engines';

// Identical UI to the Astro version (same ids/classes so the shared
// stylesheet + shared search behavior work untouched). Rendered through
// TanStack Router; the client behavior module is loaded once the DOM
// exists, mirroring Astro's end-of-body <script>.
export default function IndexPage() {
  useEffect(() => {
    void import('../search');
  }, []);

  return (
    <>
      {/* Header */}
      <header className="w-full p-6 flex justify-between items-center">
        <div className="flex space-x-8">
          <button
            id="gemini-search-btn"
            className="text-blue-200 hover:text-white transition-colors relative group"
          >
            <svg
              height="1em"
              style={{ flex: 'none', lineHeight: 1 }}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10"
              fill="currentColor"
            >
              <title>Gemini</title>
              <path d="M12 24A14.304 14.304 0 000 12 14.304 14.304 0 0012 0a14.305 14.305 0 0012 12 14.305 14.305 0 00-12 12" fill="currentColor" fillRule="nonzero"></path>
            </svg>
            <div id="gemini-indicator" className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full opacity-0 transition-opacity"></div>
            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">AI Mode</span>
          </button>
          <button
            id="pro-plus-toggle"
            className="text-blue-200 hover:text-white transition-colors relative group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Pro</span>
            <div id="pro-plus-indicator" className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full opacity-0 transition-opacity"></div>
          </button>
        </div>
        <div className="flex space-x-8">
          <button
            className="text-blue-200 hover:text-white transition-colors relative group"
            onClick={() => window.open('https://mail.proton.me/u/5/inbox', '_blank')}
          >
            <svg
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              className="h-10 w-10"
            >
              <defs>
                <style>{'.a,.b{fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:2;}.b{fill-rule:evenodd;}'}</style>
              </defs>
              <path className="a" d="M4.5,9.2662a.8965.8965,0,0,1,1.4693-.69L21.4224,21.41a4.0348,4.0348,0,0,0,5.1552,0L42.0307,8.5765a.8965.8965,0,0,1,1.4693.69V35.5976a4.0345,4.0345,0,0,1-4.0345,4.0345H8.5345A4.0345,4.0345,0,0,1,4.5,35.5976Z"></path>
              <path className="b" d="M29.2651,19.1777l.0021.0018-7.7823,6.8744a3.5862,3.5862,0,0,1-4.6673.07L4.5,15.8794"></path>
              <line className="a" x1="35.2069" y1="14.2434" x2="35.2069" y2="39.6321"></line>
            </svg>
            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Proton</span>
          </button>
          <a
            href="https://www.gmail.com"
            className="text-blue-200 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </a>
          <a
            href="https://github.com/adityavardhansharma"
            target="_blank"
            className="text-blue-200 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 0C5.373 0 0 5.373 0 12c0 5.303 3.438 9.8 8.207
            11.387.6.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416
            -.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729
            1.205.084 1.839 1.237 1.237 1.237 1.07 1.834
            2.807 1.304 3.492.997.107-.776.419-1.305.763-1.604
            -2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381
            1.236-3.221-.124-.303-.535-1.524.117-3.176
            0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404
            1.02.005 2.047.138 3.006.404 2.289-1.552 3.297-1.23
            3.297-1.23.653 1.654.242 2.874.118 3.176.77.84 1.235 1.912
            1.235 3.222 0 4.609-2.807 5.624-5.479 5.921.43.372.823
            1.102.823 2.222v3.293c0 .319.192.693.801.576
            4.765-1.589 8.199-6.086 8.199-11.386
            0-6.627-5.373-12-12-12z"
              />
            </svg>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-2xl text-center mb-12">
          <h1 className="text-6xl font-bold mb-10 metallic-text">SEARCH</h1>
          <div className="relative">
            <div className="gradient-border w-full glow">
              <div className="flex items-center bg-black/90 backdrop-blur-sm p-5 rounded-md border border-blue-400/30">
                <div className="flex items-center w-full">
                  <div id="engine-selector-container" className="engine-selector-container relative z-10">
                    <button id="engine-selector-main" className="engine-selector-main" aria-label="Select search engine">
                      <span
                        id="current-engine-icon"
                        className="h-6 w-6 transition-all duration-300"
                        dangerouslySetInnerHTML={{ __html: engines[0].svg }}
                      />
                    </button>
                    <div id="engine-options" className="engine-options absolute left-0 top-0 flex items-center">
                      {engines.map((engine) => (
                        <button
                          key={engine.key}
                          className="engine-option"
                          data-engine={engine.key}
                          data-tooltip={engine.tooltip}
                          aria-label={engine.ariaLabel}
                          dangerouslySetInnerHTML={{ __html: engine.svg }}
                        />
                      ))}
                    </div>
                  </div>
                  <input
                    id="search-input"
                    type="text"
                    autoComplete="off"
                    placeholder="Search anything..."
                    className="w-full bg-transparent text-white border-0 focus:outline-none text-xl placeholder-blue-200/60 font-medium"
                  />
                  <button id="search-btn" className="ml-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-7 w-7 text-blue-300 hover:text-white transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div id="suggestions"></div>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center space-y-6 text-sm font-medium text-blue-300">
            <div className="flex justify-center space-x-6">
              <span>POWERED BY: UNDUCK</span>
              <span>•</span>
              <span>BANG SEARCH OPTIMIZED</span>
              <span>•</span>
              <span>VERSION: V3.0</span>
            </div>
            <div className="text-blue-300/80 text-xs tracking-wide text-center">
              <span className="text-blue-200 font-bold">Ctrl + K:</span> Switch Search Engines
              <span className="text-blue-300/60 mx-2">|</span>
              <span className="text-blue-200 font-bold">Ctrl + Shift + O:</span> Toggle AI Mode
              <br />
              <span className="text-blue-200 font-bold">Pro Mode:</span> Click Lightning Icon for Kagi Search <span className="text-blue-300/60">(Ad-free & No Tracking)</span>
            </div>
          </div>
        </div>
      </main>

      {/* Circular Engine Modal for Mobile */}
      <div id="engine-circular-modal" className="engine-circular-modal">
        <button className="engine-modal-close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="engine-circle-container">
          <div className="engine-center-icon">
            <span
              id="center-engine-icon"
              style={{ display: 'contents' }}
              dangerouslySetInnerHTML={{ __html: engines[0].svg }}
            />
          </div>
          {engines.map((engine) => (
            <button key={engine.key} className="engine-circle-option" data-engine={engine.key}>
              <span className="engine-circle-label">{engine.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full p-6 text-center"></footer>
    </>
  );
}
