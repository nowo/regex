import antfu, { GLOB_MARKDOWN_CODE, parserPlain } from '@antfu/eslint-config'

export default antfu(
    {
        stylistic: {
            indent: 4,
            quotes: 'single',
            semi: false,
        },
        lessOpinionated: true, // 去除 antfu 的强意见配置
        typescript: true,
        vue: true, // playground 用 Vue
        ignores: [
            '**/dist/**',
            '**/.nuxt/**',
            '**/.output/**',
            '**/node_modules/**',
            'DESIGN.md', // 规划文档，非交付源码（含 `|` in code span 等 markdownlint 误报）
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
        // README 等文档里的代码块是面向阅读的示例（API 签名展示、未使用的演示变量），
        // 不是要编译运行的源码。用 parserPlain 当纯文本处理，避免 unused-vars / 排序等误报。
        files: [GLOB_MARKDOWN_CODE],
        name: 'local/markdown-code-as-plain',
        languageOptions: { parser: parserPlain },
    },
)
