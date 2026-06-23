<script setup lang="ts">
const props = defineProps<{
    pattern: string
    flags: string
    activeGroup?: number | null
}>()

const { t } = useI18n()

const testString = ref('')
const replacement = ref('')
const activeMethod = defineModel<MethodName>('activeMethod', { default: 'test' })

// Badge always reflects `.test()` regardless of the selected tab.
const testRun = computed(() => runMethod('test', props.pattern, props.flags, testString.value, ''))
const total = computed(() => testRun.value.lines.length)
const passed = computed(() => testRun.value.lines.filter(l => l.ok).length)

const run = computed(() => runMethod(activeMethod.value, props.pattern, props.flags, testString.value, replacement.value))

// A line split into styled segments: the match, and (on group hover) that group.
function lineSegments(r: LineRun) {
    if (!r.match) {
        return [{ text: r.line, cls: '' }]
    }
    const ranges: { start: number, end: number, type: 'match' | 'group' }[] = [
        { start: r.match.start, end: r.match.end, type: 'match' },
    ]
    if (props.activeGroup != null) {
        const g = r.groups[props.activeGroup]
        if (g && g.start != null && g.end != null) {
            ranges.push({ start: g.start, end: g.end, type: 'group' })
        }
    }
    return buildSegments(r.line, ranges)
}
</script>

<template>
    <UCard>
        <div class="flex items-center gap-2 mb-3">
            <h2 class="text-sm font-semibold text-highlighted">
                {{ t('test.title') }}
            </h2>
            <UBadge
                v-if="total" :color="passed === total ? 'success' : passed ? 'primary' : 'neutral'" variant="subtle"
                size="sm"
            >
                {{ passed }}/{{ total }} {{ t('test.matched') }}
            </UBadge>
        </div>

        <UTextarea
            v-model="testString" :rows="5" :placeholder="t('test.placeholder')" class="w-full font-mono"
            :ui="{ base: 'font-mono text-sm' }" autoresize spellcheck="false"
        />

        <!-- Method tabs -->
        <div class="mt-3 flex flex-wrap gap-1">
            <UButton
                v-for="m in METHODS" :key="m" :variant="activeMethod === m ? 'solid' : 'soft'"
                :color="activeMethod === m ? 'primary' : 'neutral'" size="xs" class="font-mono"
                @click="activeMethod = m"
            >
                {{ m }}
            </UButton>
        </div>

        <UInput
            v-if="activeMethod === 'replace'" v-model="replacement" :placeholder="t('test.replacePlaceholder')"
            class="w-full font-mono mt-2" size="sm" spellcheck="false"
        />

        <p class="mt-2 text-xs">
            <code class="font-mono text-muted">{{ run.code }}</code>
        </p>

        <!-- Per-line results for the selected method -->
        <ul v-if="total" class="mt-1 divide-y divide-default">
            <li v-for="(r, i) in run.lines" :key="i" class="flex items-start gap-2 py-1.5 text-sm">
                <UIcon
                    v-if="r.ok !== undefined" :name="r.ok ? 'i-lucide-check' : 'i-lucide-x'"
                    class="size-4 mt-0.5 shrink-0" :class="r.ok ? 'text-success' : 'text-error'"
                />
                <!-- eslint-disable-next-line vue/singleline-html-element-content-newline -->
                <code
                    class="rr-line shrink-0 max-w-[45%] font-mono"
                ><template v-for="(s, j) in lineSegments(r)" :key="j"><mark v-if="s.cls" :class="`rr-${s.cls}`">{{ s.text }}</mark><span v-else>{{ s.text }}</span></template></code>
                <code
                    v-if="activeMethod !== 'test'"
                    class="font-mono text-primary break-all flex-1 text-dimmed"
                >→ {{ r.result }}</code>
                <UBadge v-else-if="r.full" color="success" variant="soft" size="sm" class="shrink-0 ms-auto">
                    {{ t('test.full') }}
                </UBadge>
            </li>
        </ul>
    </UCard>
</template>

<style scoped>
.rr-line {
    white-space: pre-wrap;
    overflow-wrap: break-word;
    word-break: break-word;
}

.rr-line mark {
    color: inherit;
    border-radius: 2px;
}

.rr-line .rr-match {
    background: color-mix(in oklch, var(--ui-primary) 22%, transparent);
}

.rr-line .rr-group {
    background: var(--rr-source-hl, #fde047);
    color: #1f2937;
}
</style>
