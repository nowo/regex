<script setup lang="ts">
import type { SyntaxCategory } from '@wzo/regex-diagram'

const emit = defineEmits<{ insert: [token: string] }>()
const { t, locale } = useI18n()

// An entry may list several related tokens that share one description
// (e.g. \d,\w,\s). Each token stays individually clickable for insertion.
// `cat` ties the tokens to the shared syntax palette so they read the same
// color here as in the diagram and the explanation.
interface Entry { tokens: string[], cat: SyntaxCategory, zh: string, en: string }
interface Group { zh: string, en: string, items: Entry[] }

const groups: Group[] = [
    {
        zh: '字符类',
        en: 'Character classes',
        items: [
            { tokens: ['.'], cat: 'charset', zh: '除换行符以外的所有字符', en: 'any char except newline' },
            { tokens: ['\\d', '\\w', '\\s'], cat: 'charset', zh: '匹配数字、字符、空格', en: 'digit, word char, whitespace' },
            { tokens: ['\\D', '\\W', '\\S'], cat: 'charset', zh: '匹配非数字、非字符、非空格', en: 'non-digit, non-word, non-whitespace' },
            { tokens: ['[abc]'], cat: 'class', zh: '匹配 a、b 或 c 中的一个字母', en: 'one of a, b or c' },
            { tokens: ['[a-z]'], cat: 'class', zh: '匹配 a 到 z 中的一个字母', en: 'one letter from a to z' },
            { tokens: ['[^abc]'], cat: 'class', zh: '匹配除了 a、b 或 c 中的其他字母', en: 'any char except a, b, c' },
        ],
    },
    {
        zh: '锚点',
        en: 'Anchors',
        items: [
            { tokens: ['^'], cat: 'anchor', zh: '字符串开头', en: 'start of string' },
            { tokens: ['$'], cat: 'anchor', zh: '字符串结尾', en: 'end of string' },
            { tokens: ['\\b', '\\B'], cat: 'anchor', zh: '单词边界、非单词边界', en: 'word / non-word boundary' },
        ],
    },
    {
        zh: '量词',
        en: 'Quantifiers',
        items: [
            { tokens: ['?'], cat: 'quantifier', zh: '0 次或 1 次匹配', en: '0 or 1 time' },
            { tokens: ['*'], cat: 'quantifier', zh: '匹配 0 次或多次', en: '0 or more times' },
            { tokens: ['+'], cat: 'quantifier', zh: '匹配 1 次或多次', en: '1 or more times' },
            { tokens: ['{n}'], cat: 'quantifier', zh: '匹配 n 次', en: 'exactly n times' },
            { tokens: ['{n,}'], cat: 'quantifier', zh: '匹配 n 次以上', en: 'n or more times' },
            { tokens: ['{m,n}'], cat: 'quantifier', zh: '最少 m 次，最多 n 次匹配', en: 'between m and n times' },
            { tokens: ['*?'], cat: 'quantifier', zh: '懒惰匹配（尽量少）', en: 'lazy (as few as possible)' },
        ],
    },
    {
        zh: '分组与引用',
        en: 'Groups & references',
        items: [
            { tokens: ['(expr)'], cat: 'group', zh: '捕获 expr 子模式，以 \\1 使用它', en: 'capture expr, reuse with \\1' },
            { tokens: ['(?:expr)'], cat: 'group', zh: '忽略捕获的子模式', en: 'non-capturing group' },
            { tokens: ['(?<name>expr)'], cat: 'group', zh: '命名捕获组', en: 'named capturing group' },
            { tokens: ['aa|bb'], cat: 'alternation', zh: '匹配 aa 或 bb', en: 'match aa or bb' },
            { tokens: ['\\1'], cat: 'backref', zh: '反向引用第 1 个分组', en: 'backreference to group 1' },
            { tokens: ['\\k<name>'], cat: 'backref', zh: '命名反向引用', en: 'named backreference' },
        ],
    },
    {
        zh: '断言',
        en: 'Lookaround',
        items: [
            { tokens: ['(?=expr)'], cat: 'lookaround', zh: '正向预查模式 expr', en: 'positive lookahead' },
            { tokens: ['(?!expr)'], cat: 'lookaround', zh: '负向预查模式 expr', en: 'negative lookahead' },
            { tokens: ['(?<=expr)'], cat: 'lookaround', zh: '正向后行预查模式 expr', en: 'positive lookbehind' },
            { tokens: ['(?<!expr)'], cat: 'lookaround', zh: '负向后行预查模式 expr', en: 'negative lookbehind' },
        ],
    },
    {
        zh: 'Unicode（需 u/v 标志）',
        en: 'Unicode (needs u/v flag)',
        items: [
            { tokens: ['\\p{L}'], cat: 'charset', zh: '匹配某 Unicode 属性', en: 'has unicode property' },
            { tokens: ['\\P{L}'], cat: 'charset', zh: '不匹配某 Unicode 属性', en: 'lacks unicode property' },
        ],
    },
]

function pick(e: Entry): string {
    return locale.value === 'zh' ? e.zh : e.en
}
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
            <section v-for="g in groups" :key="g.en" class="space-y-1">
                <h3 class="text-xs font-semibold uppercase tracking-wide text-dimmed px-1">
                    {{ locale === 'zh' ? g.zh : g.en }}
                </h3>
                <ul>
                    <li v-for="e in g.items" :key="e.tokens.join(',')">
                        <div class="flex items-start gap-2 rounded-md px-2 py-1 hover:bg-elevated transition-colors">
                            <span class="flex flex-wrap items-center gap-x-1 shrink-0 min-w-[4.5rem]">
                                <template v-for="(tok, i) in e.tokens" :key="tok">
                                    <button type="button"
                                        class="text-xs hover:underline"
                                        @click="emit('insert', tok)">
                                        <RegexCode :text="tok" :fallback-cat="e.cat" />
                                    </button>
                                    <span v-if="i < e.tokens.length - 1" class="text-dimmed text-xs">,</span>
                                </template>
                            </span>
                            <span class="text-xs text-muted leading-snug">{{ pick(e) }}</span>
                        </div>
                    </li>
                </ul>
            </section>
        </div>
    </div>
</template>
