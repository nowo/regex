<script setup lang="ts">
const { locale } = useI18n()

useHead({
    htmlAttrs: { lang: computed(() => (locale.value === 'zh' ? 'zh-CN' : 'en-US')) },
    titleTemplate: title => (title ? `${title} · regex` : 'regex — regular expression visualizer'),
})
</script>

<template>
    <UApp>
        <AppHeader />
        <UMain>
            <NuxtPage />
        </UMain>
        <AppFooter />
    </UApp>
</template>
