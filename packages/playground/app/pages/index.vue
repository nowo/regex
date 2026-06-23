<script setup lang="ts">
import { regexToSvg, toRegexLiteral } from '@wzo/regex-diagram'

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

// The full, valid regex literal shown above the diagram and copied by the button.
const literal = computed(() => toRegexLiteral(debounced.value.pattern, debounced.value.flags))
// Just the escaped source (between the slashes), for the coloured display.
const literalSource = computed(() => {
    const f = debounced.value.flags
    return literal.value.slice(1, literal.value.length - f.length - 1)
})

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

// --- Node hover → highlight the matching range in the input ---
const highlight = ref<{ start: number, end: number } | null>(null)

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
    { label: 'URL', pattern: '(https?|ftp)://[^\\s/$.?#].[^\\s]*', flags: 'i' },
    { label: 'Hex color', pattern: '#[0-9a-fA-F]{6}\\b', flags: '' },
    { label: 'Alternation', pattern: 'a|b|c', flags: '' },
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
                    <RegexField
                        ref="patternInput"
                        v-model="pattern"
                        :highlight="highlight"
                        :placeholder="t('home.placeholder')"
                        class="flex-1 min-w-[12rem]"
                        @paste="onPaste"
                    />
                    <span class="text-dimmed font-mono text-lg">/</span>
                    <UInput v-model="flags" class="w-20 font-mono" size="lg" placeholder="flags" spellcheck="false" />
                </div>

                <div class="flex flex-wrap gap-1.5">
                    <UButton
                        v-for="f in ALL_FLAGS"
                        :key="f"
                        :variant="flags.includes(f) ? 'solid' : 'outline'"
                        :color="flags.includes(f) ? 'primary' : 'neutral'"
                        size="xs"
                        @click="toggleFlag(f)"
                    >
                        {{ t(`flags.${f}`) }}<span class="font-mono opacity-70 ms-0.5">({{ f }})</span>
                    </UButton>
                </div>

                <div class="flex flex-wrap gap-1.5">
                    <UButton icon="i-lucide-link" color="neutral" variant="outline" size="sm" :label="t('toolbar.copyLink')" @click="copyLink" />
                    <UButton icon="i-lucide-download" color="neutral" variant="outline" size="sm" label="SVG" @click="exportSvg" />
                    <UButton icon="i-lucide-image" color="neutral" variant="outline" size="sm" label="PNG" @click="exportPng" />
                </div>

                <UCard>
                    <div class="flex items-center gap-2 mb-3 pb-3 border-b border-default">
                        <code class="flex-1 min-w-0 truncate font-mono text-sm">
                            <span class="text-dimmed">/</span><span class="text-highlighted">{{ literalSource }}</span><span class="text-dimmed">/</span><span class="text-primary">{{ debounced.flags }}</span>
                        </code>
                        <UButton icon="i-lucide-copy" size="xs" color="neutral" variant="ghost" :label="t('toolbar.copyRegex')" class="shrink-0" @click="copyRegex" />
                    </div>
                    <RailroadDiagram :pattern="debounced.pattern" :flags="debounced.flags" @hover="highlight = $event" />
                </UCard>

                <div class="space-y-2">
                    <p class="text-sm text-dimmed">
                        {{ t('home.examples') }}
                    </p>
                    <div class="flex flex-wrap gap-2">
                        <UButton
                            v-for="ex in examples"
                            :key="ex.label"
                            variant="soft"
                            color="neutral"
                            size="sm"
                            @click="loadExample(ex)"
                        >
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
