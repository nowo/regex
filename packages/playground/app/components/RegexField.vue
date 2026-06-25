<script setup lang="ts">
// A single-line regex field with in-place syntax highlighting. The visible text
// is a backdrop layer that colors each character via the shared syntax palette
// (and tints the highlighted sub-range); a transparent input sits on top so
// editing/caret still work. Both layers share font/padding so characters line up,
// and the backdrop follows the input's scroll.
import { sourceColors } from '@wzo/regex-diagram'

const props = defineProps<{
    flags?: string
    highlight?: { start: number, end: number } | null
    placeholder?: string
}>()
// Reports the caret's character offset (null when the field loses focus) so the
// parent can light up the diagram node under the cursor.
const emit = defineEmits<{ caret: [pos: number | null] }>()

const model = defineModel<string>({ default: '' })

const inputRef = ref<HTMLInputElement>()
const backdropRef = ref<HTMLDivElement>()
defineExpose({ inputRef })

function reportCaret() {
    emit('caret', inputRef.value?.selectionStart ?? null)
}

const ESC_RE = /[&<>]/g
function esc(s: string): string {
    return s.replace(ESC_RE, c => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'))
}

// One escaped <span> per character: colored by its syntax category (falls back to
// plain text while the pattern is mid-edit / invalid), and tinted when it falls in
// the highlighted range. Rendered via v-html so it stays whitespace-exact.
const backdropHtml = computed(() => {
    const v = model.value
    const cats = sourceColors(v, props.flags ?? '')
    const h = props.highlight
    let out = ''
    for (let i = 0; i < v.length; i++) {
        const cat = cats?.[i]
        const style = cat ? ` style="color:var(--rr-syntax-${cat})"` : ''
        const hl = h && i >= h.start && i < h.end ? ' class="rf-hl"' : ''
        out += `<span${hl}${style}>${esc(v.charAt(i))}</span>`
    }
    return out
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
            spellcheck="false" autocomplete="off" autocapitalize="off" autocorrect="off" @scroll="syncScroll"
            @click="reportCaret" @keyup="reportCaret" @select="reportCaret" @focus="reportCaret"
            @blur="emit('caret', null)">
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

.rf-backdrop .rf-hl {
    background: color-mix(in oklch, var(--rr-source-hl, #fde047) 45%, transparent);
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
