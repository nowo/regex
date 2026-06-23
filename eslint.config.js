import antfu, { GLOB_MARKDOWN_CODE, parserPlain } from '@antfu/eslint-config'

export default antfu(
    {
        stylistic: {
            indent: 4,
            quotes: 'single',
            semi: false,
        },
        lessOpinionated: true,
        typescript: true,
        vue: true,
        ignores: [
            '**/dist/**',
            '**/.nuxt/**',
            '**/.output/**',
            '**/node_modules/**',
            'DESIGN.md',
        ],
    },
    {
        rules: {
            'no-console': [
                'warn',
                {
                    allow: ['error', 'warn'],
                },
            ],
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    argsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            'curly': ['error', 'multi-line', 'consistent'],
            'style/brace-style': ['error', '1tbs', { allowSingleLine: true }],
            'yaml/indent': 'off',
        },
    },
    {
        // Remember to specify the file glob here, otherwise it might cause the vue plugin to handle non-vue files
        files: ['**/*.vue'],
        rules: {
            'vue/first-attribute-linebreak': [
                'warn',
                {
                    multiline: 'beside',
                },
            ],
            'vue/html-indent': ['error', 4, {
                alignAttributesVertically: false,
            }],
            'vue/html-closing-bracket-newline': [
                'error',
                {
                    singleline: 'never',
                    multiline: 'never',
                    selfClosingTag: {
                        singleline: 'never',
                        multiline: 'never',
                    },
                },
            ],
            'vue/no-multiple-template-root': ['off'],
        },
    },
    {
        // Code blocks in README and other documents are example snippets for reading (API signature display, unused demo variables), not source code to be compiled and run. Use parserPlain to handle them as plain text to avoid false reports of unused-vars / sorting, etc.
        files: [GLOB_MARKDOWN_CODE],
        name: 'local/markdown-code-as-plain',
        languageOptions: { parser: parserPlain },
    },
)
