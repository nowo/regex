<script setup lang="ts">
const props = defineProps<{ pattern: string, flags: string, method: MethodName }>()
const { t } = useI18n()
const toast = useToast()
const { copy } = useClipboard()

const code = computed(() => buildJsSnippet(props.pattern, props.flags, props.method))

async function copyCode() {
    await copy(code.value)
    toast.add({ title: t('code.copied'), icon: 'i-lucide-check', color: 'success' })
}
</script>

<template>
    <UCard>
        <div class="flex items-center gap-2 mb-2">
            <h2 class="text-sm font-semibold text-highlighted">
                {{ t('code.title') }}
            </h2>
            <UButton
                icon="i-lucide-copy" size="xs" color="neutral" variant="ghost" :label="t('code.copy')"
                class="ms-auto" @click="copyCode"
            />
        </div>
        <pre
            class="text-sm font-mono whitespace-pre-wrap break-words rounded-md bg-muted p-3 overflow-x-auto"
        >{{ code }}</pre>
    </UCard>
</template>
