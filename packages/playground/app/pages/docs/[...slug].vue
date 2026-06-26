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
</script>

<template>
    <UContainer class="py-8">
        <div class="grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)_180px]">
            <aside class="hidden lg:block lg:sticky lg:top-20 lg:self-start">
                <nav class="flex flex-col gap-0.5 text-sm">
                    <ULink v-for="item in links" :key="item.path"
                        :to="localePath(`/docs${item.path}`)"
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
                <UContentSurround v-if="page" :surround="surroundLinks" class="mt-12" />
            </article>

            <UContentToc v-if="toc.length" :links="toc" :title="t('docs.onThisPage')" highlight
                class="hidden lg:block lg:sticky lg:top-20 lg:self-start" />
        </div>
    </UContainer>
</template>
