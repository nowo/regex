<script setup lang="ts">
// A single-line text field that can highlight a sub-range of its value.
// The visible text is rendered by a backdrop layer (with a <mark>); a transparent
// input sits on top so editing/caret still work. The two layers share identical
// font/padding so characters line up, and the backdrop follows the input's scroll.

const props = defineProps<{
    highlight?: { start: number, end: number } | null
    placeholder?: string
}>()

const model = defineModel<string>({ default: '' })

const inputRef = ref<HTMLInputElement>()
const backdropRef = ref<HTMLDivElement>()
defineExpose({ inputRef })

const ESC_RE = /[&<>]/g
function esc(s: string): string {
    return s.replace(ESC_RE, c => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'))
}

// The visible text, with the highlighted range wrapped in <mark>. Rendered via
// v-html (each piece escaped) so it stays whitespace-exact and formatter-proof.
const backdropHtml = computed(() => {
    const v = model.value
    const h = props.highlight
    if (!h || h.start >= h.end) {
        return esc(v)
    }
    return `${esc(v.slice(0, h.start))}<mark>${esc(v.slice(h.start, h.end))}</mark>${esc(v.slice(h.end))}`
})

function syncScroll() {
    if (backdropRef.value && inputRef.value) {
        backdropRef.value.scrollLeft = inputRef.value.scrollLeft
    }
}

watch(model, () => nextTick(syncScroll))
</script>

<template>
    <div class="rf">
        <!-- eslint-disable-next-line vue/no-v-html -- each piece is escaped above -->
        <div ref="backdropRef" class="rf-layer rf-backdrop" aria-hidden="true" v-html="backdropHtml" />
        <input ref="inputRef" v-model="model" type="text" class="rf-layer rf-input" :placeholder="placeholder"
            spellcheck="false" autocomplete="off" autocapitalize="off" autocorrect="off" @scroll="syncScroll">
    </div>
</template>

<style scoped>
.rf {
    position: relative;
    border: 1px solid var(--ui-border-accented);
    border-radius: calc(var(--ui-radius) * 1.5);
    background: var(--ui-bg);
    overflow: hidden;
}

.rf:focus-within {
    border-color: var(--ui-primary);
    box-shadow: 0 0 0 2px color-mix(in oklch, var(--ui-primary) 25%, transparent);
}

.rf-layer {
    box-sizing: border-box;
    width: 100%;
    margin: 0;
    padding: 0.5rem 0.75rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 1rem;
    line-height: 1.5;
    letter-spacing: normal;
    white-space: pre;
    overflow-x: auto;
}

.rf-backdrop {
    position: absolute;
    inset: 0;
    pointer-events: none;
    color: var(--ui-text);
    overflow: hidden;
}

.rf-backdrop mark {
    background: var(--rr-source-hl, #fde047);
    color: #1f2937;
    border-radius: 2px;
}

.rf-input {
    position: relative;
    display: block;
    border: 0;
    background: transparent;
    color: transparent;
    caret-color: var(--ui-text);
    outline: none;
}

.rf-input::placeholder {
    color: var(--ui-text-dimmed);
}

.rf-input::selection {
    background: color-mix(in oklch, var(--ui-primary) 30%, transparent);
}
</style>
