<script setup lang="ts">
import { buildDiagram, parseRegex, renderToSvg } from '@wzo/regex-diagram'

const props = defineProps<{ pattern: string, flags?: string }>()
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

// Hovering either a diagram node or a source-band character highlights both, plus
// the input, via the shared source range carried in data-start/end. The diagram
// node, the source chars within the range, and the match group all light up together.
let activeKey = ''

function clearActive(root: Element) {
    root.querySelectorAll('.rr-active').forEach(n => n.classList.remove('rr-active'))
    root.querySelectorAll('.rr-src-on').forEach(n => n.classList.remove('rr-src-on'))
}

function onPointer(e: MouseEvent) {
    const root = e.currentTarget as Element
    const hit = (e.target as Element).closest?.('[data-start]') ?? null
    if (!hit) {
        if (activeKey) {
            clearActive(root)
            activeKey = ''
            emit('hover', null)
        }
        return
    }
    const start = Number(hit.getAttribute('data-start'))
    const end = Number(hit.getAttribute('data-end'))
    const key = `${start}:${end}`
    if (key === activeKey) {
        return
    }
    activeKey = key
    clearActive(root)

    // Light up the diagram node(s) sharing this exact range, and read the match group off them.
    let group: number | undefined
    root.querySelectorAll(`[data-start="${start}"][data-end="${end}"]:not(.rr-src-char)`).forEach((n) => {
        n.classList.add('rr-active')
        const g = n.getAttribute('data-group')
        if (g != null) {
            group = Number(g)
        }
    })
    // Light up the source characters within the range.
    root.querySelectorAll('.rr-src-char').forEach((c) => {
        const i = Number(c.getAttribute('data-i'))
        if (i >= start && i < end) {
            c.classList.add('rr-src-on')
        }
    })
    emit('hover', { start, end, group })
}

function onLeave(e: MouseEvent) {
    clearActive(e.currentTarget as Element)
    activeKey = ''
    emit('hover', null)
}
</script>

<template>
    <div class="rr-host">
        <!-- eslint-disable-next-line vue/no-v-html -- trusted SVG produced by our own renderer -->
        <div v-if="result.ok" class="rr-scroll" @mouseover="onPointer" @mouseleave="onLeave" v-html="result.svg" />
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
