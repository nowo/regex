import defineConfig, { GLOB_MARKDOWN_CODE, parserPlain } from '@wzo/eslint-config'

export default defineConfig(
    {
        vue: true,
        ignores: ['**/.nuxt/**', '**/.output/**', 'DESIGN.md'],
    },
    {
        // README code blocks are reading examples (unused demo vars, API signatures),
        // not source to compile — treat them as plain text.
        files: [GLOB_MARKDOWN_CODE],
        name: 'regex/markdown-plain',
        languageOptions: { parser: parserPlain },
    },
)
