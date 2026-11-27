import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: ['~/assets/css/main.css'],

  devServer: {
    port: 3002,
  },

  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: true,
      minify: 'esbuild',
    },
  },

  nitro: {
    compressPublicAssets: true,
    routeRules: {
      '/api/suggestions': {
        headers: {
          'Cache-Control': 'public, max-age=120, s-maxage=600, stale-while-revalidate=86400',
        },
      },
      '/_nuxt/**': {
        headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
      },
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1.0',
      title: 'AVS Search',
      meta: [
        { name: 'title', content: 'AVS Search - Privacy-Focused Google Alternative | Multi-Engine Search Without Tracking' },
        { name: 'description', content: 'The best Google alternative with zero tracking, no ads, and multi-engine search. Switch between Web, Reddit, YouTube, AI Search, and more. Privacy-first search engine with Kagi Pro mode, Gemini AI integration, and bang commands.' },
        { name: 'author', content: 'AVS Search' },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'googlebot', content: 'index, follow' },
        { name: 'bingbot', content: 'index, follow' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://avssearch.vercel.app/' },
        { property: 'og:title', content: 'AVS Search - Privacy-Focused Google Alternative | No Tracking, No Ads' },
        { property: 'og:description', content: 'Switch from Google to AVS Search: A privacy-first search engine with multi-engine support (Web, Reddit, YouTube, AI), zero tracking, and no advertisements. Features Pro mode with Kagi integration and Gemini AI search.' },
        { property: 'og:image', content: 'https://avssearch.vercel.app/rocket.png' },
        { property: 'og:site_name', content: 'AVS Search' },
        { property: 'og:locale', content: 'en_US' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:url', content: 'https://avssearch.vercel.app/' },
        { name: 'twitter:title', content: 'AVS Search - Privacy-Focused Google Alternative' },
        { name: 'twitter:description', content: 'The best Google alternative with zero tracking and no ads. Multi-engine search with AI integration, Pro mode, and bang commands for privacy-conscious users.' },
        { name: 'twitter:image', content: 'https://avssearch.vercel.app/rocket.png' },
        { name: 'twitter:creator', content: '@AVSSearch' },
        { name: 'theme-color', content: '#000000' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'AVS Search' },
        { name: 'application-name', content: 'AVS Search' },
        { name: 'msapplication-TileColor', content: '#000000' },
      ],
      link: [
        { rel: 'canonical', href: 'https://avssearch.vercel.app/' },
        { rel: 'icon', type: 'image/png', href: '/rocket.png' },
      ],
      script: [
        {
          type: 'application/ld+json',
          innerHTML: '{"@context":"https://schema.org","@type":"WebSite","name":"AVS Search","url":"https://avssearch.vercel.app/"}',
        },
      ],
    },
  },
});
