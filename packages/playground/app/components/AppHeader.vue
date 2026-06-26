<script setup lang="ts">
const { locale, setLocale } = useI18n()
const localePath = useLocalePath()

function toggleLocale() {
    setLocale(locale.value === 'en' ? 'zh' : 'en')
}
</script>

<template>
    <UHeader>
        <template #title>
            <NuxtLink :to="localePath('index')" class="flex items-center gap-2">
                <UIcon name="i-lucide-route" class="size-6 text-primary" />
                <span class="font-bold text-highlighted">regex</span>
            </NuxtLink>
        </template>

        <template #right>
            <UButton :to="localePath('usage')" icon="i-lucide-book-open" color="neutral" variant="ghost"
                aria-label="@wzo/regex-diagram">
                <span class="hidden font-mono text-xs sm:inline">@wzo/regex-diagram</span>
            </UButton>
            <UButton :label="locale === 'en' ? '中文' : 'EN'" icon="i-lucide-languages" color="neutral" variant="ghost"
                @click="toggleLocale" />
            <UColorModeButton />
            <UButton icon="i-simple-icons-github" color="neutral" variant="ghost" to="https://github.com/nowo/regex"
                target="_blank" aria-label="GitHub" />
        </template>
    </UHeader>
</template>
