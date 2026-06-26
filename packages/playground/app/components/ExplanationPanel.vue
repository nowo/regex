<script setup lang="ts">
import { explainRegex, formatExplain, sourceColors } from '@wzo/regex-diagram'

const props = defineProps<{ pattern: string, flags: string }>()
const { t, locale } = useI18n()

const items = computed(() => explainRegex(props.pattern, props.flags))
// One coloring for the whole pattern; each line slices its own token's colors out
// of it, so the explanation matches the diagram's source band character for character.
const colors = computed(() => sourceColors(props.pattern, props.flags))
// Localize the explanation by handing formatExplain a translated table; English
// (the core default) needs no table at all.
const messages = computed(() => (locale.value === 'zh' ? EXPLAIN_ZH : undefined))
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
                <RegexCode v-if="it.token" class="shrink-0"
                    :text="it.token"
                    :colors="it.start != null && colors ? colors.slice(it.start, it.end) : undefined"
                    :fallback-cat="it.cat" />
                <span class="text-muted">{{ formatExplain(it.desc, messages) }}</span>
            </li>
        </ul>
        <p v-else class="text-dimmed text-sm">
            {{ t('explain.invalid') }}
        </p>
    </UCard>
</template>
