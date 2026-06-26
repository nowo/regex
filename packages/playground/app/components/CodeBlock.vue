<script setup lang="ts">
// A Shiki-highlighted code block with a hover copy button. Uses the module's dual
// theme (CSS variables) so it follows the app's color mode without re-rendering.
const props = defineProps<{ code: string, lang?: 'typescript' | 'bash' | 'css' }>()
const { t } = useI18n()
const toast = useToast()
const { copy } = useClipboard()

async function onCopy() {
    await copy(props.code)
    toast.add({ title: t('usage.copied'), icon: 'i-lucide-check', color: 'success' })
}
</script>

<template>
    <div class="group relative">
        <Shiki :code="code" :lang="lang ?? 'typescript'" class="code-block" />
        <UButton icon="i-lucide-copy" size="xs" color="neutral" variant="ghost"
            class="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100" :aria-label="t('usage.copy')"
            @click="onCopy" />
    </div>
</template>

<style scoped>
/* nuxt-shiki renders <pre class="code-block"><code class="shiki">…</code></pre>;
   the theme background sits on the <code>, so round/clip on the <pre>. */
.code-block {
    border: 1px solid var(--ui-border);
    border-radius: 0.5rem;
    overflow: hidden;
}

.code-block :deep(code) {
    display: block;
    padding: 0.75rem 0.875rem;
    font-size: 0.8125rem;
    line-height: 1.55;
    overflow-x: auto;
    tab-size: 2;
}

/* Dual-theme: swap to the dark palette (CSS vars Shiki emits) under .dark. */
.dark .code-block :deep(code.shiki),
.dark .code-block :deep(code.shiki span) {
    color: var(--shiki-dark) !important;
    background-color: var(--shiki-dark-bg) !important;
}
</style>
