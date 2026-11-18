import type { Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { appMeta } from './src/appMeta';

/** Puts the app's title, description and theme colours from appMeta into the page's head. */
function appHead(): Plugin {
  return {
    name: 'app-head',
    transformIndexHtml: () => [
      { tag: 'title', children: appMeta.name, injectTo: 'head' },
      {
        tag: 'meta',
        attrs: { name: 'description', content: appMeta.description },
        injectTo: 'head',
      },
      {
        tag: 'meta',
        attrs: {
          name: 'theme-color',
          content: appMeta.background.light,
          media: '(prefers-color-scheme: light)',
        },
        injectTo: 'head',
      },
      {
        tag: 'meta',
        attrs: {
          name: 'theme-color',
          content: appMeta.background.dark,
          media: '(prefers-color-scheme: dark)',
        },
        injectTo: 'head',
      },
    ],
  };
}

export default defineConfig({
  base: '/board_games/',
  plugins: [
    appHead(),
    VitePWA({
      // A new version waits until the player chooses to update between games: reloading by
      // itself could interrupt a game.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        id: '/board_games/',
        name: appMeta.name,
        short_name: appMeta.name,
        description: appMeta.description,
        lang: appMeta.lang,
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: appMeta.background.dark,
        theme_color: appMeta.background.dark,
        launch_handler: { client_mode: 'navigate-existing' },
        icons: [
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        // Shown by Chromium's install dialog on phones.
        screenshots: [
          {
            src: 'screenshots/forside.jpg',
            sizes: '780x1688',
            type: 'image/jpeg',
            form_factor: 'narrow',
            label: 'Forsiden med spillene',
          },
          {
            src: 'screenshots/parkort.jpg',
            sizes: '780x1688',
            type: 'image/jpeg',
            form_factor: 'narrow',
            label: 'Et spørgsmål i Parkort',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,woff2}'],
        // Fonts for alphabets the games do not use, and images only used when installing.
        globIgnores: [
          '**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2',
          'icons/icon-*.png',
        ],
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/**/*.test.{ts,tsx}', 'src/**/*.d.ts'],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
  },
});
