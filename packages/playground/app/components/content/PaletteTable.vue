<script setup lang="ts">
// MDC component for the theming docs: the live syntax-palette table. Swatches use
// the real --rr-syntax-* CSS vars (so they track the color mode); the hex column
// lists the light-mode default. `tok` is plain regex syntax, kept out of i18n.
const { locale } = useI18n()

const ROWS = [
    { cat: 'literal', hex: '#3b82f6', tok: 'a b 1' },
    { cat: 'charset', hex: '#16a34a', tok: '\\d \\w .' },
    { cat: 'class', hex: '#d97706', tok: '[a-z] [^0-9]' },
    { cat: 'anchor', hex: '#8b5cf6', tok: '^ $ \\b' },
    { cat: 'quantifier', hex: '#c026d3', tok: '* + ? {n,m}' },
    { cat: 'group', hex: '#e11d48', tok: '( ) (?: (?<n>' },
    { cat: 'lookaround', hex: '#ea580c', tok: '(?= (?! (?<=' },
    { cat: 'backref', hex: '#0d9488', tok: '\\1 \\k<n>' },
    { cat: 'alternation', hex: '#64748b', tok: 'a|b|c' },
]

const DESC: Record<string, Record<string, string>> = {
    en: {
        literal: 'Plain literal characters',
        charset: 'Shorthand character sets and the dot',
        class: 'Bracketed character classes',
        anchor: 'Anchors and word boundaries',
        quantifier: 'Quantifiers and counted repeats',
        group: 'Capturing and non-capturing groups',
        lookaround: 'Lookahead and lookbehind',
        backref: 'Backreferences',
        alternation: 'Alternation between branches',
    },
    zh: {
        literal: '普通字面字符',
        charset: '简写字符集与点号',
        class: '方括号字符类',
        anchor: '锚点与单词边界',
        quantifier: '量词与定量重复',
        group: '捕获组与非捕获组',
        lookaround: '前瞻与后顾',
        backref: '反向引用',
        alternation: '分支择一',
    },
}

const rows = computed(() => {
    const d = DESC[locale.value === 'zh' ? 'zh' : 'en']!
    return ROWS.map(r => ({ ...r, desc: d[r.cat]! }))
})
</script>

<template>
    <ul class="not-prose my-4 divide-y divide-default rounded-md border border-default">
        <li v-for="p in rows" :key="p.cat" class="flex items-center gap-3 p-2.5">
            <span class="size-4 shrink-0 rounded" :style="{ background: `var(--rr-syntax-${p.cat})` }" />
            <code class="w-24 shrink-0 font-mono text-xs text-highlighted">{{ p.cat }}</code>
            <code class="w-20 shrink-0 font-mono text-xs text-dimmed">{{ p.hex }}</code>
            <code class="hidden w-28 shrink-0 font-mono text-xs text-primary sm:block">{{ p.tok }}</code>
            <span class="text-sm text-muted">{{ p.desc }}</span>
        </li>
    </ul>
</template>
