<script setup lang="ts">
import type { SyntaxCategory } from '@wzo/regex-diagram'
import { sourceColors } from '@wzo/regex-diagram'

// Renders a snippet of regex as syntax-colored code, using the same per-character
// palette as the diagram's source band. Pass `colors` to reuse a coloring already
// computed for the whole pattern (avoids re-parsing); otherwise the snippet is
// parsed on its own, falling back to `fallbackCat` as a single color if it cannot
// be parsed in isolation (e.g. a bare quantifier or back-reference example).
const props = defineProps<{
    text: string
    flags?: string
    colors?: (SyntaxCategory | null)[]
    fallbackCat?: SyntaxCategory
}>()

const ESC_RE = /[&<>]/g
function esc(s: string): string {
    return s.replace(ESC_RE, c => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'))
}

function span(ch: string, cat: SyntaxCategory | null | undefined): string {
    const style = cat ? ` style="color:var(--rr-syntax-${cat})"` : ''
    return `<span${style}>${esc(ch)}</span>`
}

// Built as an HTML string (rendered via v-html) so the per-character spans sit
// flush against each other — any template whitespace would show as gaps.
const html = computed(() => {
    const cats = props.colors ?? sourceColors(props.text, props.flags ?? '')
    if (!cats) {
        return span(props.text, props.fallbackCat ?? null)
    }
    let out = ''
    for (let i = 0; i < props.text.length; i++) {
        out += span(props.text.charAt(i), cats[i])
    }
    return out
})
</script>

<template>
    <!-- eslint-disable-next-line vue/no-v-html -- each character is escaped above -->
    <code class="font-mono" v-html="html" />
</template>
