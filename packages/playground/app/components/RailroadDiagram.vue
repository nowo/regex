<script setup lang="ts">
import { buildDiagram, parseRegex, renderToSvg } from '@wzo/regex-diagram'

const props = defineProps<{
    pattern: string
    flags?: string
    // External highlight driven by the input's caret — lights up the matching
    // node + source band, the same way hovering a node does.
    highlight?: { start: number, end: number } | null
}>()
const emit = defineEmits<{ hover: [range: { start: number, end: number, group?: number } | null] }>()
const { t } = useI18n()

// parseRegex now returns syntax + semantic problems together (`issues`); the
// diagram only renders when there are none.
const parsed = computed(() => parseRegex(props.pattern, props.flags ?? ''))
const svg = computed(() =>
    parsed.value.ok && parsed.value.issues.length === 0
        ? renderToSvg(buildDiagram(parsed.value.ast), props.flags ?? '')
        : '',
)

// Errors (syntax or semantic) render the same way: a message plus the pattern
// with the offending span marked inline.
interface ErrorItem { message: string, mark: { before: string, at: string, after: string } | null }

const errorItems = computed<ErrorItem[]>(() => {
    const p = props.pattern
    const mark = (start: number, end: number) => ({ before: p.slice(0, start), at: p.slice(start, end) || ' ', after: p.slice(end) })
    return parsed.value.issues.map(issue => ({
        // Localize known lint rules; fall back to the parser's text for syntax errors.
        message: issue.rule === 'assertionNeverMatches'
            ? t('lint.assertionNeverMatches')
            : issue.rule === 'emptyCharClass'
                ? t('lint.emptyCharClass')
                : issue.message,
        mark: issue.start != null && issue.end != null ? mark(issue.start, issue.end) : null,
    }))
})

// Highlighting comes from two sources sharing one visual: hovering a diagram node
// / source-band char (transient), and the input caret via the `highlight` prop.
// Hover takes precedence while the pointer is over a node; on leave we fall back
// to the caret highlight. The matched node, source-band cells, and capture group
// all light up together, keyed by the source range carried in data-start/end.
const scrollRef = ref<HTMLElement>()
let currentKey = ''
let hovering = false

function keyOf(start?: number | null, end?: number | null): string {
    return start == null || end == null ? '' : `${start}:${end}`
}

// Clear, then light up the node(s) with this exact range plus the source-band
// cells within it. Returns the matched capture group, if any.
function paint(root: Element, start: number | null, end: number | null): number | undefined {
    root.querySelectorAll('.rr-active').forEach(n => n.classList.remove('rr-active'))
    root.querySelectorAll('.rr-src-on').forEach(n => n.classList.remove('rr-src-on'))
    if (start == null || end == null) {
        return undefined
    }
    let group: number | undefined
    root.querySelectorAll(`[data-start="${start}"][data-end="${end}"]:not(.rr-src-char)`).forEach((n) => {
        n.classList.add('rr-active')
        const g = n.getAttribute('data-group')
        if (g != null) {
            group = Number(g)
        }
    })
    root.querySelectorAll('.rr-src-bg').forEach((c) => {
        const i = Number(c.getAttribute('data-i'))
        if (i >= start && i < end) {
            c.classList.add('rr-src-on')
        }
    })
    return group
}

// Show the caret-driven highlight (used when the pointer isn't over a node).
function showCaret(root: Element) {
    const key = keyOf(props.highlight?.start, props.highlight?.end)
    if (key !== currentKey) {
        currentKey = key
        paint(root, props.highlight?.start ?? null, props.highlight?.end ?? null)
    }
}

function onPointer(e: MouseEvent) {
    const root = e.currentTarget as Element
    const hit = (e.target as Element).closest?.('[data-start]') ?? null
    if (!hit) {
        hovering = false
        showCaret(root)
        emit('hover', null)
        return
    }
    hovering = true
    const start = Number(hit.getAttribute('data-start'))
    const end = Number(hit.getAttribute('data-end'))
    if (keyOf(start, end) === currentKey) {
        return
    }
    currentKey = keyOf(start, end)
    const group = paint(root, start, end)
    emit('hover', { start, end, group })
}

function onLeave(e: MouseEvent) {
    hovering = false
    showCaret(e.currentTarget as Element)
    emit('hover', null)
}

// Caret moved in the input: apply it unless a hover is currently showing.
watch(() => props.highlight, () => {
    if (!hovering && scrollRef.value) {
        showCaret(scrollRef.value)
    }
})

// A re-render (pattern/flags change) replaces the SVG and drops highlight classes;
// reapply the caret highlight against the fresh DOM.
watch(parsed, () => {
    if (!hovering) {
        currentKey = ''
        nextTick(() => scrollRef.value && showCaret(scrollRef.value))
    }
})
</script>

<template>
    <div class="rr-host">
        <div v-if="errorItems.length" class="space-y-2">
            <div v-for="(e, i) in errorItems" :key="i" class="space-y-1">
                <UAlert color="error" variant="subtle" icon="i-lucide-circle-alert" :title="e.message" />
                <pre v-if="e.mark"
                    class="rr-err-line"><span>{{ e.mark.before }}</span><mark>{{ e.mark.at }}</mark><span>{{ e.mark.after }}</span></pre>
            </div>
        </div>
        <!-- eslint-disable-next-line vue/no-v-html -- trusted SVG produced by our own renderer -->
        <div v-else ref="scrollRef" class="rr-scroll" @mouseover="onPointer" @mouseleave="onLeave"
            v-html="svg" />
    </div>
</template>

<style scoped>
.rr-scroll {
    overflow-x: auto;
}

.rr-err-line {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.9rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    background: var(--ui-bg-muted);
    overflow-x: auto;
}

.rr-err-line mark {
    background: var(--ui-error, #ef4444);
    color: #fff;
    border-radius: 2px;
    padding: 0 1px;
}
</style>
