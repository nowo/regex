<script setup lang="ts">
const route = useRoute()
const { locale, t } = useI18n()
const localePath = useLocalePath()

// The slug after /docs maps to a content path; the locale picks the collection.
const path = computed(() => {
    const slug = (route.params.slug as string[] | undefined) ?? []
    return `/${slug.join('/') || 'getting-started'}`
})
const collection = computed(() => (locale.value === 'zh' ? 'docsZh' : 'docsEn'))

const { data: page } = await useAsyncData(
    () => `docs-${collection.value}-${path.value}`,
    () => queryCollection(collection.value).path(path.value).first(),
    { watch: [collection, path] },
)

const { data: nav } = await useAsyncData(
    () => `docs-nav-${collection.value}`,
    () => queryCollectionNavigation(collection.value),
    { watch: [collection] },
)

// Previous / next page within the same locale's collection.
const { data: surround } = await useAsyncData(
    () => `docs-surround-${collection.value}-${path.value}`,
    () => queryCollectionItemSurroundings(collection.value, path.value, { fields: ['title', 'description'] }),
    { watch: [collection, path] },
)

// Flatten any one-level nesting into a single ordered list of pages.
const links = computed(() =>
    (nav.value ?? []).flatMap(n => ('children' in n && n.children?.length ? n.children : [n])),
)

const toc = computed(() => page.value?.body?.toc?.links ?? [])

// Rewrite each surround link's content path (/examples) to the real route
// (/docs/examples, /zh/docs/examples), preserving empty ends.
const surroundLinks = computed(() =>
    (surround.value ?? []).map(item => (item ? { ...item, path: localePath(`/docs${item.path}`) } : item)),
)

// Full-text search index for the current locale's collection.
const { data: files } = await useAsyncData(
    () => `docs-search-${collection.value}`,
    () => queryCollectionSearchSections(collection.value),
    { watch: [collection] },
)

// Search-result links carry content paths (/examples#x); rewrite to the real
// route (/docs/examples#x, /zh/docs/...) like the nav and prev/next links.
const searchFiles = computed(() =>
    (files.value ?? []).map((f) => {
        const [p, hash] = f.id.split('#')
        return { ...f, id: localePath(`/docs${p}`) + (hash ? `#${hash}` : '') }
    }),
)

// Navigation for the search panel, with the same path rewrite so it lines up
// with searchFiles.
const searchNav = computed(() =>
    links.value.map(n => ({ ...n, path: localePath(`/docs${n.path}`) })),
)
</script>

<template>
    <UContainer class="py-8">
        <UContentSearch :files="searchFiles" :navigation="searchNav" />
        <div class="grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)_180px]">
            <aside class="hidden lg:block lg:sticky lg:top-20 lg:self-start">
                <UContentSearchButton :label="t('docs.search')" :collapsed="false" class="mb-3 w-full" />
                <nav class="flex flex-col gap-0.5 text-sm">
                    <ULink v-for="item in links" :key="item.path" :to="localePath(`/docs${item.path}`)"
                        class="rounded-md px-2.5 py-1.5"
                        :class="path === item.path ? 'bg-elevated text-highlighted font-medium' : 'text-muted hover:text-highlighted'">
                        {{ item.title }}
                    </ULink>
                </nav>
            </aside>

            <article class="min-w-0">
                <ContentRenderer v-if="page" :value="page" />
                <p v-else class="text-dimmed">
                    Not found.
                </p>
                <UContentSurround v-if="page" :surround="surroundLinks"
                    class="mt-12 mb-10 border-t border-default pt-12" />
            </article>

            <UContentToc v-if="toc.length" :links="toc" :title="t('docs.onThisPage')" highlight
                class="hidden lg:block lg:sticky lg:top-20 lg:self-start" />
        </div>
    </UContainer>
</template>
