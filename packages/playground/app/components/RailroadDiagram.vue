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

const result = computed(() => {
    const r = parseRegex(props.pattern, props.flags ?? '')
    if (!r.ok) {
        return { ok: false as const, message: r.message, index: r.index, where: r.where }
    }
    return { ok: true as const, svg: renderToSvg(buildDiagram(r.ast), props.flags ?? '') }
})

// The pattern split around the error position, for an inline caret highlight.
const errorParts = computed(() => {
    if (result.value.ok || result.value.where !== 'pattern') {
        return null
    }
    const i = result.value.index
    const p = props.pattern
    return { before: p.slice(0, i), at: p.slice(i, i + 1) || ' ', after: p.slice(i + 1) }
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
watch(result, () => {
    if (!hovering) {
        currentKey = ''
        nextTick(() => scrollRef.value && showCaret(scrollRef.value))
    }
})
</script>

<template>
    <div class="rr-host">
        <!-- eslint-disable-next-line vue/no-v-html -- trusted SVG produced by our own renderer -->
        <div v-if="result.ok" ref="scrollRef" class="rr-scroll" @mouseover="onPointer" @mouseleave="onLeave"
            v-html="result.svg" />
        <div v-else class="space-y-2">
            <UAlert color="error" variant="subtle" icon="i-lucide-circle-alert" :title="result.message" />
            <pre v-if="errorParts"
                class="rr-err-line"><span>{{ errorParts.before }}</span><mark>{{ errorParts.at }}</mark><span>{{ errorParts.after }}</span></pre>
        </div>
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
