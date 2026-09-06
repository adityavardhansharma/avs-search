import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    // Explicit runtime: required by adapter-vercel on newer local Node,
    // and pins the serverless runtime on Vercel.
    adapter: adapter({ runtime: 'nodejs22.x' }),
  },
};

export default config;
