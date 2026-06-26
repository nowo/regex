<script setup lang="ts">
// Documentation page for the @wzo/regex-diagram package.
const { t } = useI18n()
const localePath = useLocalePath()

const install = 'pnpm add @wzo/regex-diagram'

// String.raw so the regex escapes (\\d) display exactly as you'd type them.
const quickstart = String.raw`import { regexToSvg, parseRegex, explainRegex } from '@wzo/regex-diagram'

// One-shot: regex → standalone SVG string (null if invalid or broken)
const svg = regexToSvg('(\\d{4})-(\\d{2})', 'g')

// Parse + validate: syntax AND semantic issues
const { ok, ast, issues } = parseRegex('a$\\d')

// Plain-language, step-by-step explanation
const steps = explainRegex('(?<year>\\d{4})')`

// Practical examples (paired with localized headings/descriptions).
const examples = computed(() => [
    {
        title: t('usage.exRenderTitle'),
        desc: t('usage.exRenderDesc'),
        code: String.raw`import { regexToSvg } from '@wzo/regex-diagram'

// Returns a self-contained SVG string, or null if the regex is invalid/broken.
const svg = regexToSvg('(?<year>\\d{4})-(?<month>\\d{2})', 'g')
document.querySelector('#out')!.innerHTML = svg ?? 'invalid regex'`,
    },
    {
        title: t('usage.exValidateTitle'),
        desc: t('usage.exValidateDesc'),
        code: String.raw`import { parseRegex } from '@wzo/regex-diagram'

const result = parseRegex('a$\\d') // valid syntax, but never matches
if (!result.ok || result.issues.length) {
  for (const issue of result.issues) {
    console.warn(issue.message, 'at', issue.start)
  }
}`,
    },
    {
        title: t('usage.exExplainTitle'),
        desc: t('usage.exExplainDesc'),
        code: String.raw`import { explainRegex } from '@wzo/regex-diagram'

for (const step of explainRegex('(?<y>\\d{4})') ?? []) {
  console.log('  '.repeat(step.depth) + step.token + ' — ' + step.text)
}`,
    },
    {
        title: t('usage.exLowerTitle'),
        desc: t('usage.exLowerDesc'),
        code: String.raw`import { buildDiagram, parseRegex, renderToSvg } from '@wzo/regex-diagram'

const parsed = parseRegex('a|b|c')
if (parsed.ok) {
  const diagram = buildDiagram(parsed.ast) // positioned model
  const svg = renderToSvg(diagram, 'i')    // model → SVG string
}`,
    },
])

const features = computed(() => [
    t('usage.featureSyntax'),
    t('usage.featureSvg'),
    t('usage.featureLint'),
    t('usage.featureExplain'),
    t('usage.featureAgnostic'),
])

// API reference. `sig` is plain text; `desc` is localized.
const apis = computed(() => [
    { sig: 'regexToSvg(source, flags?) → string | null', desc: t('api.regexToSvg') },
    { sig: 'parseRegex(source, flags?) → { ok, ast, issues }', desc: t('api.parseRegex') },
    { sig: 'lintRegex(source, flags?) → RegexIssue[]', desc: t('api.lintRegex') },
    { sig: 'explainRegex(source, flags?) → ExplainItem[] | null', desc: t('api.explainRegex') },
    { sig: 'formatExplain(desc, messages?) → string', desc: t('api.formatExplain') },
    { sig: 'EXPLAIN_EN: ExplainMessages', desc: t('api.explainEn') },
    { sig: 'buildDiagram(ast) → Diagram', desc: t('api.buildDiagram') },
    { sig: 'renderToSvg(diagram, flags?) → string', desc: t('api.renderToSvg') },
    { sig: 'sourceColors(source, flags?) → (SyntaxCategory | null)[] | null', desc: t('api.sourceColors') },
    { sig: 'sourceRanges(source, flags?) → ([number, number] | null)[] | null', desc: t('api.sourceRanges') },
    { sig: 'toRegexLiteral(source, flags?) → string', desc: t('api.toRegexLiteral') },
])

// The types returned/accepted by the API above.
const types = String.raw`// Returned in parseRegex().issues and by lintRegex()
interface RegexIssue {
  rule?: 'assertionNeverMatches' | 'emptyCharClass' // stable id; absent for syntax errors
  message: string  // human-readable (the parser's text for syntax errors)
  start?: number   // pattern offsets of the offending token, when known
  end?: number
}

// One line of explainRegex()
interface ExplainItem {
  depth: number       // nesting level, for indentation
  cat: SyntaxCategory // the token's syntax category (drives the shared color)
  token: string       // the source slice this line describes
  desc: ExplainDesc   // language-neutral description — render this to localize
  text: string        // English rendering of desc, for zero-config use
  start?: number
  end?: number
}

// Language-neutral explanation node — switch on kind to localize it.
// (shape simplified; see the .d.ts for the exact discriminated unions)
type ExplainDesc =
  | { kind: 'char', value: string }
  | { kind: 'text', value: string }
  | { kind: 'charset', set: 'any' | 'digit' | 'word' | 'space' | 'property', negate?: boolean, raw?: string }
  | { kind: 'class', negate: boolean, members: ClassMember[] }
  | { kind: 'anchor', at: 'start' | 'end' | 'word', negate?: boolean }
  | { kind: 'lookaround', dir: 'ahead' | 'behind', negate: boolean }
  | { kind: 'quantifier', min: number, max: number, greedy: boolean }
  | { kind: 'group', capturing: boolean, index?: number, name?: string }
  | { kind: 'backref', index?: number }
  | { kind: 'option', n: number }
  // …and 'space' / 'classExpr'

// Color-category keys — also the --rr-syntax-* variable suffixes
type SyntaxCategory =
  | 'literal' | 'charset' | 'class' | 'anchor' | 'quantifier'
  | 'group' | 'lookaround' | 'backref' | 'alternation'`

// How a library consumer localizes the explanation: pass formatExplain a
// translated message table — partial is fine, omitted keys fall back to English.
const localizeExample = String.raw`import { explainRegex, formatExplain } from '@wzo/regex-diagram'

// Zero config — item.text is ready-made English:
for (const it of explainRegex('a+', 'i') ?? [])
  console.log(it.text)

// Localize — hand formatExplain your translated table (no i18n library needed).
// Templates use {placeholder} slots; any key you omit stays English.
const zh = {
  csDigit: '数字（0-9）',
  qExact: '恰好重复 {n} 次',
  qRange: '重复 {min} 到 {max} 次',
  groupNamed: '捕获组 #{index}（命名为 "{name}"）',
  // …only the keys you want to translate
}
for (const it of explainRegex('(?<y>\\d{2,4})') ?? [])
  console.log(formatExplain(it.desc, zh))`

// The shared syntax palette: one color per category, with its light-mode default
// and the regex tokens it colors. Swatches use the live CSS var, so they track
// the current color mode. `tok` is plain regex syntax — kept out of i18n.
const palette = computed(() => [
    { cat: 'literal', hex: '#3b82f6', tok: 'a b 1', desc: t('usage.palette.literal') },
    { cat: 'charset', hex: '#16a34a', tok: '\\d \\w \\s .', desc: t('usage.palette.charset') },
    { cat: 'class', hex: '#d97706', tok: '[a-z] [^0-9]', desc: t('usage.palette.class') },
    { cat: 'anchor', hex: '#8b5cf6', tok: '^ $ \\b', desc: t('usage.palette.anchor') },
    { cat: 'quantifier', hex: '#c026d3', tok: '* + ? {n,m}', desc: t('usage.palette.quantifier') },
    { cat: 'group', hex: '#e11d48', tok: '( ) (?: (?<n>', desc: t('usage.palette.group') },
    { cat: 'lookaround', hex: '#ea580c', tok: '(?= (?! (?<=', desc: t('usage.palette.lookaround') },
    { cat: 'backref', hex: '#0d9488', tok: '\\1 \\k<n>', desc: t('usage.palette.backref') },
    { cat: 'alternation', hex: '#64748b', tok: 'a|b|c', desc: t('usage.palette.alternation') },
])

// Recolor by overriding the --rr-syntax-* variables on any wrapper element.
const cssPalette = String.raw`/* The SVG ships with these light-mode defaults baked in; override only
   the variables you want to change, on any element wrapping the SVG. */
.regex-diagram {
  --rr-syntax-literal: #3b82f6;     /* a b 1            */
  --rr-syntax-charset: #16a34a;     /* \d \w \s .       */
  --rr-syntax-class: #d97706;       /* [a-z] [^0-9]     */
  --rr-syntax-anchor: #8b5cf6;      /* ^ $ \b           */
  --rr-syntax-quantifier: #c026d3;  /* * + ? {n,m}      */
  --rr-syntax-group: #e11d48;       /* ( ) (?<name>     */
  --rr-syntax-lookaround: #ea580c;  /* (?= (?! (?<=     */
  --rr-syntax-backref: #0d9488;     /* \1 \k<name>      */
  --rr-syntax-alternation: #64748b; /* a|b|c            */
}`

// Structural vars (rail / text / labels) plus the hover knobs — mostly what a
// dark theme needs, since the colored boxes already read on a dark card.
const cssStructure = String.raw`.dark .regex-diagram {
  --rr-rail: #64748b;   /* connecting rail            */
  --rr-text: #e2e8f0;   /* source band + box text     */
  --rr-muted: #94a3b8;  /* group / class labels       */
  --rr-group: #64748b;  /* neutral group outline      */
}

/* Source-band hover highlight: tint strength and glow spread. */
.regex-diagram {
  --rr-syntax-hl-opacity: 0.18;
  --rr-syntax-glow: 8px;
}`
</script>

<template>
    <UContainer class="py-8 space-y-8 max-w-3xl">
        <UButton :to="localePath('index')" icon="i-lucide-arrow-left" color="neutral" variant="ghost"
            :label="t('nav.home')" class="-ms-2" />

        <header class="space-y-2">
            <h1 class="text-3xl font-bold text-highlighted">
                @wzo/regex-diagram
            </h1>
            <p class="text-muted">
                {{ t('usage.subtitle') }}
            </p>
            <p class="text-sm text-muted leading-relaxed">
                {{ t('usage.intro') }}
            </p>
        </header>

        <section class="space-y-2">
            <h2 class="text-sm font-semibold text-highlighted">
                {{ t('usage.features') }}
            </h2>
            <ul class="list-disc ps-5 space-y-1 text-sm text-muted marker:text-primary">
                <li v-for="f in features" :key="f">
                    {{ f }}
                </li>
            </ul>
        </section>

        <section class="space-y-2">
            <h2 class="text-sm font-semibold text-highlighted">
                {{ t('usage.install') }}
            </h2>
            <CodeBlock :code="install" lang="bash" />
        </section>

        <section class="space-y-2">
            <h2 class="text-sm font-semibold text-highlighted">
                {{ t('usage.quickstart') }}
            </h2>
            <CodeBlock :code="quickstart" />
        </section>

        <section class="space-y-4">
            <h2 class="text-sm font-semibold text-highlighted">
                {{ t('usage.examples') }}
            </h2>
            <div v-for="ex in examples" :key="ex.title" class="space-y-1.5">
                <h3 class="text-sm font-medium text-highlighted">
                    {{ ex.title }}
                </h3>
                <p class="text-sm text-muted">
                    {{ ex.desc }}
                </p>
                <CodeBlock :code="ex.code" />
            </div>
        </section>

        <section class="space-y-2">
            <h2 class="text-sm font-semibold text-highlighted">
                {{ t('usage.api') }}
            </h2>
            <ul class="divide-y divide-default rounded-md border border-default">
                <li v-for="a in apis" :key="a.sig" class="p-3 space-y-1">
                    <code class="font-mono text-sm text-primary break-all">{{ a.sig }}</code>
                    <p class="text-sm text-muted">
                        {{ a.desc }}
                    </p>
                </li>
            </ul>
        </section>

        <section class="space-y-2">
            <h2 class="text-sm font-semibold text-highlighted">
                {{ t('usage.types') }}
            </h2>
            <p class="text-sm text-muted">
                {{ t('usage.typesIntro') }}
            </p>
            <CodeBlock :code="types" />
        </section>

        <section class="space-y-2">
            <h2 class="text-sm font-semibold text-highlighted">
                {{ t('usage.localize') }}
            </h2>
            <p class="text-sm text-muted leading-relaxed">
                {{ t('usage.localizeIntro') }}
            </p>
            <CodeBlock :code="localizeExample" />
        </section>

        <section class="space-y-4">
            <h2 class="text-sm font-semibold text-highlighted">
                {{ t('usage.theme') }}
            </h2>
            <p class="text-sm text-muted leading-relaxed">
                {{ t('usage.themeIntro') }}
            </p>

            <div class="space-y-2">
                <h3 class="text-sm font-medium text-highlighted">
                    {{ t('usage.themePalette') }}
                </h3>
                <p class="text-sm text-muted">
                    {{ t('usage.themePaletteIntro') }}
                </p>
                <ul class="divide-y divide-default rounded-md border border-default">
                    <li v-for="p in palette" :key="p.cat" class="flex items-center gap-3 p-2.5">
                        <span class="size-4 shrink-0 rounded" :style="{ background: `var(--rr-syntax-${p.cat})` }" />
                        <code class="font-mono text-xs text-highlighted w-24 shrink-0">{{ p.cat }}</code>
                        <code class="font-mono text-xs text-dimmed w-20 shrink-0">{{ p.hex }}</code>
                        <code class="font-mono text-xs text-primary hidden shrink-0 w-28 sm:block">{{ p.tok }}</code>
                        <span class="text-sm text-muted">{{ p.desc }}</span>
                    </li>
                </ul>
                <CodeBlock :code="cssPalette" lang="css" />
            </div>

            <div class="space-y-2">
                <h3 class="text-sm font-medium text-highlighted">
                    {{ t('usage.themeStructure') }}
                </h3>
                <p class="text-sm text-muted">
                    {{ t('usage.themeStructureIntro') }}
                </p>
                <CodeBlock :code="cssStructure" lang="css" />
            </div>
        </section>
    </UContainer>
</template>
