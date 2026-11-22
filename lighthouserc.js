module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: 'npm run preview',
      url: [
        'http://localhost:3000',
        'http://localhost:3000/?lang=am',
      ],
      settings: {
        headless: true,
        staticDistDir: './dist',
      },
    },
    assert: {
      assertions: {
        'categories:pwa': ['error', { minScore: 0.9 }],
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'pwa-installable': 'on',
        'pwa-splash-screen': 'on',
        'pwa-themed-omnibox': 'on',
        'pwa-content-width': 'on',
        'pwa-viewport': 'on',
        'pwa-manifest': 'on',
        'pwa-service-worker': 'on',
        'pwa-offline': 'on',
        'pwa-fast-and-reliable': 'off',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};