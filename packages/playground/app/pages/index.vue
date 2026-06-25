<script setup lang="ts">
import { regexToSvg, sourceRanges, toRegexLiteral } from '@wzo/regex-diagram'

const { t } = useI18n()
const toast = useToast()
const { copy } = useClipboard()

const pattern = ref('(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})')
const flags = ref('')

// Debounced copies feed the diagram and the URL, so fast typing doesn't thrash.
const debounced = ref({ pattern: pattern.value, flags: flags.value })
let timer: ReturnType<typeof setTimeout> | undefined
watch([pattern, flags], () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
        debounced.value = { pattern: pattern.value, flags: flags.value }
        syncUrl()
    }, 200)
})

// --- URL sharing: encode pattern + flags in the hash (#re=...&flags=...) ---
function syncUrl() {
    if (!import.meta.client) {
        return
    }
    const hash = `#re=${encodeURIComponent(pattern.value)}&flags=${encodeURIComponent(flags.value)}`
    history.replaceState(null, '', hash)
}

function readUrl() {
    const hash = location.hash.slice(1)
    if (!hash) {
        return
    }
    // Parse with decodeURIComponent (not URLSearchParams, which turns "+" into a space).
    const params: Record<string, string> = {}
    for (const kv of hash.split('&')) {
        const i = kv.indexOf('=')
        if (i === -1) {
            continue
        }
        params[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1))
    }
    if (params.re != null) {
        pattern.value = params.re
        flags.value = params.flags ?? ''
        debounced.value = { pattern: pattern.value, flags: flags.value }
    }
}

onMounted(readUrl)

async function copyLink() {
    syncUrl()
    await copy(location.href)
    toast.add({ title: t('toolbar.copied'), icon: 'i-lucide-check', color: 'success' })
}

// The full, valid regex literal, copied by the copy-regex button.
const literal = computed(() => toRegexLiteral(debounced.value.pattern, debounced.value.flags))

async function copyRegex() {
    await copy(literal.value)
    toast.add({ title: t('toolbar.copiedRegex'), icon: 'i-lucide-check', color: 'success' })
}

// --- Paste a full regex literal `/pattern/flags` → split into the two fields ---
const LITERAL_RE = /^\/(.*)\/([dgimsuvy]*)$/s

function onPaste(e: ClipboardEvent) {
    const text = e.clipboardData?.getData('text')?.trim()
    if (!text) {
        return
    }
    const m = LITERAL_RE.exec(text)
    if (!m) {
        return // not a `/.../flags` literal — let the normal paste happen
    }
    e.preventDefault()
    pattern.value = m[1]!
    flags.value = m[2] ?? ''
    debounced.value = { pattern: pattern.value, flags: flags.value }
}

// --- Flags ---
const ALL_FLAGS = ['g', 'i', 'm', 's', 'u', 'y', 'd', 'v'] as const

// The flags input stays a real <input> (free typing + placeholder); the candidate
// list is a plain dropdown opened on focus and closed on outside click.
const flagsOpen = ref(false)
const flagsWrap = useTemplateRef<HTMLElement>('flagsWrap')
onClickOutside(flagsWrap, () => {
    flagsOpen.value = false
})

// Toggle a flag from the picker; u and v are mutually exclusive.
function toggleFlag(f: string) {
    const set = new Set(flags.value.split(''))
    if (set.has(f)) {
        set.delete(f)
    } else {
        if (f === 'u') {
            set.delete('v')
        }
        if (f === 'v') {
            set.delete('u')
        }
        set.add(f)
    }
    flags.value = ALL_FLAGS.filter(x => set.has(x)).join('')
}

// --- Export ---
function currentSvg(): string | null {
    return regexToSvg(debounced.value.pattern, debounced.value.flags)
}

function triggerDownload(filename: string, blob: Blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

function exportSvg() {
    const svg = currentSvg()
    if (!svg) {
        toast.add({ title: t('toolbar.exportError'), icon: 'i-lucide-circle-alert', color: 'error' })
        return
    }
    triggerDownload('regex.svg', new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
}

function exportPng() {
    const svg = currentSvg()
    if (!svg) {
        toast.add({ title: t('toolbar.exportError'), icon: 'i-lucide-circle-alert', color: 'error' })
        return
    }
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
    const img = new Image()
    img.onload = () => {
        const scale = 2
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')!
        ctx.scale(scale, scale)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, img.width, img.height)
        ctx.drawImage(img, 0, 0)
        canvas.toBlob((blob) => {
            if (blob) {
                triggerDownload('regex.png', blob)
            }
            URL.revokeObjectURL(url)
        })
    }
    img.src = url
}

// --- Node hover → highlight the matching range in the input, and (for a
// capturing group) the captured text in the test panel ---
const highlight = ref<{ start: number, end: number } | null>(null)
const activeGroup = ref<number | null>(null)

// Shared between the test panel (method tabs) and the JS code panel.
const activeMethod = ref<MethodName>('test')

function onHover(range: { start: number, end: number, group?: number } | null) {
    highlight.value = range
    activeGroup.value = range?.group ?? null
}

// --- Input caret → highlight the matching node + source band in the diagram ---
const caretRange = ref<{ start: number, end: number } | null>(null)

function onCaret(pos: number | null) {
    if (pos == null) {
        caretRange.value = null
        return
    }
    const ranges = sourceRanges(debounced.value.pattern, debounced.value.flags)
    // Caret at offset `pos` sits before character `pos`; map it to that character
    // (or the last one when parked at the very end).
    const i = Math.min(pos, (ranges?.length ?? 0) - 1)
    const owner = i >= 0 ? ranges?.[i] : null
    caretRange.value = owner ? { start: owner[0], end: owner[1] } : null
}

// --- Syntax reference: insert a token at the caret ---
const patternInput = useTemplateRef<{ inputRef?: HTMLInputElement }>('patternInput')

function insertToken(token: string) {
    const el = patternInput.value?.inputRef
    if (!el) {
        pattern.value += token
        return
    }
    const start = el.selectionStart ?? pattern.value.length
    const end = el.selectionEnd ?? start
    pattern.value = pattern.value.slice(0, start) + token + pattern.value.slice(end)
    nextTick(() => {
        el.focus()
        const pos = start + token.length
        el.setSelectionRange(pos, pos)
    })
}

// --- Examples ---
const examples = [
    { label: 'Date', pattern: '(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})', flags: '' },
    { label: 'Phone', pattern: '^\\(?(\\d{3})\\)?[-.\\s]?(\\d{3})[-.\\s]?(\\d{4})$', flags: '' },
    { label: 'Email', pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.-]+', flags: '' },
    { label: 'URL', pattern: '(?:https?|ftp)://[^\\s/$.?#].\\S*', flags: 'i' },
    { label: 'Hex color', pattern: '#[0-9a-f]{6}\\b', flags: 'i' },
    { label: 'Alternation', pattern: 'GET|POST|PUT', flags: '' },
]

function loadExample(ex: { pattern: string, flags: string }) {
    pattern.value = ex.pattern
    flags.value = ex.flags
}
</script>

<template>
    <UContainer class="py-8 space-y-6">
        <div class="space-y-1">
            <h1 class="text-2xl font-bold text-highlighted">
                {{ t('home.title') }}
            </h1>
            <p class="text-muted">
                {{ t('home.description') }}
            </p>
        </div>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div class="space-y-5 min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                    <span class="text-dimmed font-mono text-lg">/</span>
                    <RegexField ref="patternInput" v-model="pattern" :flags="flags" :highlight="highlight"
                        @caret="onCaret" :placeholder="t('home.placeholder')" class="flex-1 min-w-[12rem]"
                        @paste="onPaste" />
                    <span class="text-dimmed font-mono text-lg">/</span>
                    <div ref="flagsWrap" class="relative">
                        <UInput v-model="flags" class="w-24 font-mono" size="lg" placeholder="flags" spellcheck="false"
                            :aria-label="t('flags.label')" @focus="flagsOpen = true" />
                        <div v-if="flagsOpen"
                            class="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-default bg-default p-1 shadow-lg">
                            <button v-for="f in ALL_FLAGS" :key="f" type="button"
                                class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-elevated"
                                @click="toggleFlag(f)">
                                <UIcon name="i-lucide-check" class="size-4 shrink-0"
                                    :class="flags.includes(f) ? 'text-primary' : 'invisible'" />
                                <span class="flex-1 text-left">{{ t(`flags.${f}`) }}</span>
                                <span class="font-mono text-xs text-dimmed">{{ f }}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="flex flex-wrap items-center gap-1.5">
                    <UButton icon="i-lucide-copy" color="primary" variant="outline" size="sm"
                        :label="t('toolbar.copyRegex')" @click="copyRegex" />
                    <UButton icon="i-lucide-link" color="neutral" variant="outline" size="sm"
                        :label="t('toolbar.copyLink')" @click="copyLink" />
                    <UButton icon="i-lucide-download" color="neutral" variant="outline" size="sm" label="SVG"
                        @click="exportSvg" />
                    <UButton icon="i-lucide-image" color="neutral" variant="outline" size="sm" label="PNG"
                        @click="exportPng" />
                </div>

                <UCard>
                    <RailroadDiagram :pattern="debounced.pattern" :flags="debounced.flags" :highlight="caretRange"
                        @hover="onHover" />
                </UCard>

                <ExplanationPanel :pattern="debounced.pattern" :flags="debounced.flags" />

                <TestPanel v-model:active-method="activeMethod" :pattern="debounced.pattern" :flags="debounced.flags"
                    :active-group="activeGroup" />

                <CodePanel :pattern="debounced.pattern" :flags="debounced.flags" :method="activeMethod" />

                <div class="space-y-2">
                    <p class="text-sm text-dimmed">
                        {{ t('home.examples') }}
                    </p>
                    <div class="flex flex-wrap gap-2">
                        <UButton v-for="ex in examples" :key="ex.label" variant="soft" color="neutral" size="sm"
                            @click="loadExample(ex)">
                            {{ ex.label }}
                        </UButton>
                    </div>
                </div>
            </div>

            <aside class="lg:sticky lg:top-20 lg:self-start">
                <SyntaxReference @insert="insertToken" />
            </aside>
        </div>
    </UContainer>
</template>
