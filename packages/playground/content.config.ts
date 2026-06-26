import { defineCollection, defineContentConfig } from '@nuxt/content'

// One collection per locale; `prefix: ''` strips the locale folder from the
// path, so both collections expose the same paths (/getting-started, /api, …)
// and the page picks the collection by the active i18n locale.
export default defineContentConfig({
    collections: {
        docsEn: defineCollection({ type: 'page', source: { include: 'en/**', prefix: '' } }),
        docsZh: defineCollection({ type: 'page', source: { include: 'zh/**', prefix: '' } }),
    },
})
