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
    { sig: 'buildDiagram(ast) → Diagram', desc: t('api.buildDiagram') },
    { sig: 'renderToSvg(diagram, flags?) → string', desc: t('api.renderToSvg') },
    { sig: 'sourceColors(source, flags?) → (SyntaxCategory | null)[] | null', desc: t('api.sourceColors') },
    { sig: 'sourceRanges(source, flags?) → ([number, number] | null)[] | null', desc: t('api.sourceRanges') },
    { sig: 'toRegexLiteral(source, flags?) → string', desc: t('api.toRegexLiteral') },
])
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
    </UContainer>
</template>
