<script setup lang="ts">
const props = defineProps<{ pattern: string, flags: string, method: MethodName }>()
const { t } = useI18n()

const code = computed(() => buildJsSnippet(props.pattern, props.flags, props.method))
</script>

<template>
    <UCard>
        <h2 class="text-sm font-semibold text-highlighted mb-2">
            {{ t('code.title') }}
        </h2>
        <CodeBlock :code="code" lang="typescript" />
    </UCard>
</template>
