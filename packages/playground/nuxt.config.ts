export default defineNuxtConfig({
    modules: [
        '@nuxt/ui',
        '@nuxt/content',
        '@nuxtjs/i18n',
        '@vueuse/nuxt',
    ],
    content: {
        // Use Node's built-in node:sqlite (Node 22+) instead of the native
        // better-sqlite3 addon, so no compile step is needed locally or in CI.
        experimental: { sqliteConnector: 'native' },
        build: {
            markdown: {
                // Same dual theme as the dynamic code panels, so docs code blocks
                // match the rest of the app in light and dark mode.
                highlight: {
                    theme: { default: 'github-light', dark: 'github-dark' },
                    langs: ['ts', 'js', 'bash', 'css', 'json'],
                },
            },
        },
    },
    css: ['~/assets/css/main.css'],
    i18n: {
        defaultLocale: 'en',
        strategy: 'prefix_except_default',
        locales: [
            { code: 'en', name: 'English', language: 'en-US', file: 'en.json' },
            { code: 'zh', name: '中文', language: 'zh-CN', file: 'zh.json' },
        ],
    },
    app: {
        head: {
            link: [
                { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
            ],
        },
    },
    devtools: { enabled: false },
    compatibilityDate: '2025-01-01',
})
