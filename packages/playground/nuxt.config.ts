export default defineNuxtConfig({
    modules: [
        '@nuxt/ui',
        '@nuxtjs/i18n',
        '@vueuse/nuxt',
        'nuxt-shiki',
    ],
    shiki: {
        bundledLangs: ['typescript', 'bash'],
        bundledThemes: ['github-light', 'github-dark'],
        // Dual theme → CSS-variable output that switches with the `.dark` class.
        defaultTheme: { light: 'github-light', dark: 'github-dark' },
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
