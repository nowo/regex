<script setup lang="ts">
const { locale, setLocale } = useI18n()

function toggleLocale() {
    setLocale(locale.value === 'en' ? 'zh' : 'en')
}
</script>

<template>
    <UHeader>
        <template #title>
            <span class="flex items-center gap-2">
                <UIcon name="i-lucide-route" class="size-6 text-primary" />
                <span class="font-bold text-highlighted">regex</span>
            </span>
        </template>

        <template #right>
            <UButton :label="locale === 'en' ? '中文' : 'EN'" icon="i-lucide-languages" color="neutral" variant="ghost"
                @click="toggleLocale" />
            <UColorModeButton />
            <UButton icon="i-simple-icons-github" color="neutral" variant="ghost" to="https://github.com/nowo/regex"
                target="_blank" aria-label="GitHub" />
        </template>
    </UHeader>
</template>
