<script setup lang="ts">
import type { SyntaxCategory } from '@wzo/regex-diagram'

const emit = defineEmits<{ insert: [token: string] }>()
const { t } = useI18n()

// `cat` ties the tokens to the shared syntax palette; `single` colors the snippet
// as one `cat` block instead of parsing it (for isolated fragments like a bare
// quantifier `{n}` or `\1` that parse to something misleading on their own).
interface Entry { tokens: string[], cat: SyntaxCategory, label: string, single?: boolean }
interface Group { title: string, items: Entry[] }

// Computed so titles/labels react to locale switches. Each description is a
// literal t('...') call (not a key built at runtime) so i18n-ally can resolve them.
const groups = computed<Group[]>(() => [
    {
        title: t('ref.groups.charClasses'),
        items: [
            { tokens: ['.'], cat: 'charset', label: t('ref.items.any') },
            { tokens: ['\\d', '\\w', '\\s'], cat: 'charset', label: t('ref.items.shorthand') },
            { tokens: ['\\D', '\\W', '\\S'], cat: 'charset', label: t('ref.items.negShorthand') },
            { tokens: ['[abc]'], cat: 'class', label: t('ref.items.set') },
            { tokens: ['[a-z]'], cat: 'class', label: t('ref.items.range') },
            { tokens: ['[^abc]'], cat: 'class', label: t('ref.items.negSet') },
        ],
    },
    {
        title: t('ref.groups.anchors'),
        items: [
            { tokens: ['^'], cat: 'anchor', label: t('ref.items.start') },
            { tokens: ['$'], cat: 'anchor', label: t('ref.items.end') },
            { tokens: ['\\b', '\\B'], cat: 'anchor', label: t('ref.items.boundary') },
        ],
    },
    {
        title: t('ref.groups.quantifiers'),
        items: [
            { tokens: ['?'], cat: 'quantifier', label: t('ref.items.opt'), single: true },
            { tokens: ['*'], cat: 'quantifier', label: t('ref.items.star'), single: true },
            { tokens: ['+'], cat: 'quantifier', label: t('ref.items.plus'), single: true },
            { tokens: ['{n}'], cat: 'quantifier', label: t('ref.items.exactly'), single: true },
            { tokens: ['{n,}'], cat: 'quantifier', label: t('ref.items.atLeast'), single: true },
            { tokens: ['{m,n}'], cat: 'quantifier', label: t('ref.items.between'), single: true },
            { tokens: ['*?'], cat: 'quantifier', label: t('ref.items.lazy'), single: true },
        ],
    },
    {
        title: t('ref.groups.grouping'),
        items: [
            { tokens: ['(expr)'], cat: 'group', label: t('ref.items.capture') },
            { tokens: ['(?:expr)'], cat: 'group', label: t('ref.items.nonCapture') },
            { tokens: ['(?<name>expr)'], cat: 'group', label: t('ref.items.named') },
            { tokens: ['aa|bb'], cat: 'alternation', label: t('ref.items.alt') },
            { tokens: ['\\1'], cat: 'backref', label: t('ref.items.backref'), single: true },
            { tokens: ['\\k<name>'], cat: 'backref', label: t('ref.items.namedBackref'), single: true },
        ],
    },
    {
        title: t('ref.groups.lookaround'),
        items: [
            { tokens: ['(?=expr)'], cat: 'lookaround', label: t('ref.items.lookahead') },
            { tokens: ['(?!expr)'], cat: 'lookaround', label: t('ref.items.negLookahead') },
            { tokens: ['(?<=expr)'], cat: 'lookaround', label: t('ref.items.lookbehind') },
            { tokens: ['(?<!expr)'], cat: 'lookaround', label: t('ref.items.negLookbehind') },
        ],
    },
    {
        title: t('ref.groups.unicode'),
        items: [
            { tokens: ['\\p{L}'], cat: 'charset', label: t('ref.items.prop') },
            { tokens: ['\\P{L}'], cat: 'charset', label: t('ref.items.negProp') },
        ],
    },
])
</script>

<template>
    <div class="rounded-lg border border-default bg-default">
        <div class="px-4 py-3 border-b border-default">
            <h2 class="text-sm font-semibold text-highlighted">
                {{ t('ref.title') }}
            </h2>
            <p class="text-xs text-muted">
                {{ t('ref.subtitle') }}
            </p>
        </div>
        <div class="p-3 space-y-5 overflow-y-auto" style="max-height: calc(100vh - 10rem)">
            <section v-for="g in groups" :key="g.title" class="space-y-1">
                <h3 class="text-xs font-semibold uppercase tracking-wide text-dimmed px-1">
                    {{ g.title }}
                </h3>
                <ul>
                    <li v-for="e in g.items" :key="e.tokens.join(',')">
                        <div class="flex items-start gap-2 rounded-md px-2 py-1 hover:bg-elevated transition-colors">
                            <span class="flex flex-wrap items-center gap-x-1 shrink-0 min-w-[4.5rem]">
                                <template v-for="(tok, i) in e.tokens" :key="tok">
                                    <button type="button" class="text-xs hover:underline" @click="emit('insert', tok)">
                                        <RegexCode :text="tok" :fallback-cat="e.cat" :single="e.single" />
                                    </button>
                                    <span v-if="i < e.tokens.length - 1" class="text-dimmed text-xs">,</span>
                                </template>
                            </span>
                            <span class="text-xs text-muted leading-snug">{{ e.label }}</span>
                        </div>
                    </li>
                </ul>
            </section>
        </div>
    </div>
</template>
