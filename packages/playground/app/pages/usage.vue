<script setup lang="ts">
// A small API doc for the @wzo/regex-diagram package.
const { t } = useI18n()
const localePath = useLocalePath()
const toast = useToast()
const { copy } = useClipboard()

const install = 'pnpm add @wzo/regex-diagram'

// String.raw so the regex escapes (\\d) display exactly as you'd type them in a JS string.
const quickstart = String.raw`import { regexToSvg, parseRegex, explainRegex } from '@wzo/regex-diagram'

// One-shot: regex → standalone SVG string (null if invalid or broken)
const svg = regexToSvg('(\\d{4})-(\\d{2})', 'g')

// Parse + validate: syntax AND semantic issues
const { ok, ast, issues } = parseRegex('a$\\d')

// Plain-language, step-by-step explanation
const steps = explainRegex('(?<year>\\d{4})')`

// `sig` is plain text (no @, so safe even though it's not i18n); `desc` is localized.
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

const features = computed(() => [
    t('usage.featureSyntax'),
    t('usage.featureSvg'),
    t('usage.featureLint'),
    t('usage.featureExplain'),
    t('usage.featureAgnostic'),
])

async function copyText(text: string) {
    await copy(text)
    toast.add({ title: t('usage.copied'), icon: 'i-lucide-check', color: 'success' })
}
</script>

<template>
    <UContainer class="py-8 space-y-6 max-w-3xl">
        <UButton :to="localePath('index')" icon="i-lucide-arrow-left" color="neutral" variant="ghost"
            :label="t('nav.home')" class="-ms-2" />

        <div class="space-y-1">
            <h1 class="text-3xl font-bold text-highlighted">
                @wzo/regex-diagram
            </h1>
            <p class="text-muted">
                {{ t('usage.subtitle') }}
            </p>
        </div>

        <p class="text-sm text-muted leading-relaxed">
            {{ t('usage.intro') }}
        </p>

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
            <div class="group relative">
                <pre class="rounded-md bg-muted p-3 font-mono text-sm overflow-x-auto">{{ install }}</pre>
                <UButton icon="i-lucide-copy" size="xs" color="neutral" variant="ghost"
                    class="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100" :aria-label="t('usage.copy')"
                    @click="copyText(install)" />
            </div>
        </section>

        <section class="space-y-2">
            <h2 class="text-sm font-semibold text-highlighted">
                {{ t('usage.quickstart') }}
            </h2>
            <div class="group relative">
                <pre class="rounded-md bg-muted p-3 font-mono text-sm overflow-x-auto">{{ quickstart }}</pre>
                <UButton icon="i-lucide-copy" size="xs" color="neutral" variant="ghost"
                    class="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100" :aria-label="t('usage.copy')"
                    @click="copyText(quickstart)" />
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
