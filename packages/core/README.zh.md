<div align="center">

<img src="https://raw.githubusercontent.com/nowo/regex/main/packages/playground/public/favicon.svg" width="76" height="76" alt="@wzo/regex-diagram logo" />

# @wzo/regex-diagram

**框架无关的正则铁路图（railroad diagram）可视化库。**<br>
解析 → 布局 → 自包含 SVG。纯 TypeScript，两个小依赖。

[![npm version](https://img.shields.io/npm/v/@wzo/regex-diagram.svg?color=10b981&label=npm)](https://www.npmjs.com/package/@wzo/regex-diagram)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/@wzo/regex-diagram?color=10b981)](https://bundlephobia.com/package/@wzo/regex-diagram)
[![license](https://img.shields.io/npm/l/@wzo/regex-diagram?color=10b981)](./LICENSE)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node-%E2%89%A516.6-5FA04E?logo=node.js&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white)

**[文档与在线 playground →](https://nowo.github.io/regex/docs/getting-started)**

<p align="center"><a href="./README.md">English</a> | <b>简体中文</b></p>

</div>

---

用现代解析器解析正则、布局成铁路图、渲染为自包含的 SVG —— 支持命名组、后行断言、
`\p{}`、具名反向引用、`v` flag 等现代语法。

## ✨ 特性

- 🚂 **铁路图** —— 解析 → 带坐标的图模型 → 独立、自包含的 SVG
- 🧩 **现代语法** —— 命名组、后行断言、Unicode 属性、`v` flag 集合运算
- ✅ **内置校验** —— 语法错误*和*语义问题（永不匹配的断言、空字符类）
- 💬 **自然语言解释** —— 逐 token，通过文案表可本地化
- 🎨 **可主题化 SVG** —— 用 `--rr-*` CSS 变量着色，支持暗色模式
- 📦 **框架无关** —— 纯函数，运行时仅 `@eslint-community/regexpp` 与 `regexp-ast-analysis`

## 📦 安装

```bash
pnpm add @wzo/regex-diagram
```

## 🚀 用法

```ts
import { buildDiagram, parseRegex, regexToSvg, renderToSvg, toRegexLiteral } from '@wzo/regex-diagram'

// 一站式：正则 → SVG 字符串
const svg = regexToSvg('(\\d{3})-(\\d{4})', 'g')

// 分步（更灵活）。parseRegex 返回 { ok, ast, issues }：
const r = parseRegex(source, flags)
if (r.ok) {
  const diagram = buildDiagram(r.ast) // 带坐标的图模型
  const svg2 = renderToSvg(diagram) // 图模型 → 静态 SVG
}

// 从 source + flags 拼出合法的正则字面量（转义 `/`、处理空值）：
toRegexLiteral('a/b', 'g') // → "/a\/b/g"
toRegexLiteral('', '') // → "/(?:)/"
```

## 📖 API

速查 —— 完整说明见 **[API 文档](https://nowo.github.io/regex/docs/api)**。

| 函数 | 作用 |
| --- | --- |
| `regexToSvg(source, flags?)` | 一站式：正则 → 独立 SVG 字符串（或 `null`） |
| `parseRegex(source, flags?)` | 解析为 AST 并校验 —— `{ ok, ast, issues }` |
| `lintRegex(source, flags?)` | 仅语义问题 |
| `explainRegex(source, flags?)` | 逐 token 的自然语言步骤 |
| `formatExplain(desc, messages?)` | 渲染单条解释，可本地化 |
| `buildDiagram(ast)` · `renderToSvg(diagram, flags?)` | 更底层的布局 + 渲染 |
| `toRegexLiteral(source, flags?)` | 拼出合法的 `/…/flags` 字面量 |

## 🙏 致谢

灵感来自 [regulex](https://github.com/CJex/regulex) 与 [regex101](https://regex101.com/)。

## 📄 许可

[MIT](./LICENSE) © 2026 nowo
