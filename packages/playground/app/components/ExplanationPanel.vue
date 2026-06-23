<script setup lang="ts">
import { explainRegex } from '@wzo/regex-diagram'

const props = defineProps<{ pattern: string, flags: string }>()
const { t } = useI18n()

const items = computed(() => explainRegex(props.pattern, props.flags))
</script>

<template>
    <UCard>
        <h2 class="text-sm font-semibold text-highlighted mb-2">
            {{ t('explain.title') }}
        </h2>
        <ul v-if="items && items.length">
            <li v-for="(it, i) in items"
                :key="i"
                class="flex items-baseline gap-2 py-0.5 text-sm"
                :style="{ paddingInlineStart: `${it.depth * 1.25}rem` }">
                <code v-if="it.token" class="font-mono text-primary shrink-0">{{ it.token }}</code>
                <span class="text-muted">{{ it.text }}</span>
            </li>
        </ul>
        <p v-else class="text-dimmed text-sm">
            {{ t('explain.invalid') }}
        </p>
    </UCard>
</template>
