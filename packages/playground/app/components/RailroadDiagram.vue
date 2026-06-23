<script setup lang="ts">
import { buildDiagram, parseRegex, renderToSvg } from '@wzo/regex-diagram'

const props = defineProps<{ pattern: string, flags?: string }>()
const emit = defineEmits<{ hover: [range: { start: number, end: number } | null] }>()

const result = computed(() => {
    const r = parseRegex(props.pattern, props.flags ?? '')
    if (!r.ok) {
        return { ok: false as const, message: r.message, index: r.index, where: r.where }
    }
    return { ok: true as const, svg: renderToSvg(buildDiagram(r.ast)) }
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

// Map a hovered diagram node back to its source range (carried in data-start/end),
// and mark it active so the node itself highlights in sync with the input.
let activeNode: Element | null = null

function setActive(node: Element | null) {
    if (node === activeNode) {
        return
    }
    activeNode?.classList.remove('rr-active')
    node?.classList.add('rr-active')
    activeNode = node
}

function onPointer(e: MouseEvent) {
    const node = (e.target as Element).closest?.('[data-start]') ?? null
    setActive(node)
    if (node) {
        emit('hover', {
            start: Number(node.getAttribute('data-start')),
            end: Number(node.getAttribute('data-end')),
        })
    } else {
        emit('hover', null)
    }
}

function onLeave() {
    setActive(null)
    emit('hover', null)
}
</script>

<template>
    <div class="rr-host">
        <!-- eslint-disable-next-line vue/no-v-html -- trusted SVG produced by our own renderer -->
        <div
            v-if="result.ok"
            class="rr-scroll"
            @mouseover="onPointer"
            @mouseleave="onLeave"
            v-html="result.svg"
        />
        <div v-else class="space-y-2">
            <UAlert color="error" variant="subtle" icon="i-lucide-circle-alert" :title="result.message" />
            <pre v-if="errorParts" class="rr-errline"><span>{{ errorParts.before }}</span><mark>{{ errorParts.at }}</mark><span>{{ errorParts.after }}</span></pre>
        </div>
    </div>
</template>

<style scoped>
.rr-scroll {
    overflow-x: auto;
}

.rr-errline {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.9rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    background: var(--ui-bg-muted);
    overflow-x: auto;
}

.rr-errline mark {
    background: var(--ui-error, #ef4444);
    color: #fff;
    border-radius: 2px;
    padding: 0 1px;
}
</style>
