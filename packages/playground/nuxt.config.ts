export default defineNuxtConfig({
    modules: [
        '@nuxt/ui',
        '@nuxtjs/i18n', // 国际化（中英双语）
    ],
    css: ['~/assets/css/main.css'],
    i18n: {
        defaultLocale: 'en', // 英文为主：默认路由无前缀（/），中文带 /zh/ 前缀
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
