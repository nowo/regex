<div align="center">

<img src="https://raw.githubusercontent.com/nowo/regex/main/packages/playground/public/favicon.svg" width="76" height="76" alt="@wzo/regex-diagram logo" />

# @wzo/regex-diagram

**Framework-agnostic regular-expression railroad-diagram visualizer.**<br>
Parse → layout → standalone SVG. Pure TypeScript, two small dependencies.

[![npm version](https://img.shields.io/npm/v/@wzo/regex-diagram.svg?color=10b981&label=npm)](https://www.npmjs.com/package/@wzo/regex-diagram)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/@wzo/regex-diagram?color=10b981)](https://bundlephobia.com/package/@wzo/regex-diagram)
[![license](https://img.shields.io/npm/l/@wzo/regex-diagram?color=10b981)](./LICENSE)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node-%E2%89%A516.6-5FA04E?logo=node.js&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white)

**[Docs &amp; playground →](https://nowo.github.io/regex/docs/getting-started)**

<p align="center"><b>English</b> | <a href="./README.zh.md">简体中文</a></p>

</div>

---

Parse a regular expression with a modern parser, lay it out as a railroad
diagram, and render it to a self-contained SVG — modern syntax included: named
groups, lookbehind, `\p{}`, named backreferences and the `v` flag.

## ✨ Features

- 🚂 **Railroad diagrams** — parse → positioned model → standalone, self-contained SVG
- 🧩 **Modern syntax** — named groups, lookbehind, Unicode properties, `v`-flag set operations
- ✅ **Validation built in** — syntax errors *and* semantic issues (never-matching assertions, empty classes)
- 💬 **Plain-language explanations** — token by token, localizable via a message table
- 🎨 **Themeable SVG** — styled with `--rr-*` CSS variables, dark-mode ready
- 📦 **Framework-agnostic** — pure functions, only `@eslint-community/regexpp` and `regexp-ast-analysis` at runtime

## 📦 Install

```bash
pnpm add @wzo/regex-diagram
```

## 🚀 Usage

```ts
import { buildDiagram, parseRegex, regexToSvg, renderToSvg, toRegexLiteral } from '@wzo/regex-diagram'

// One-shot: regex → SVG string
const svg = regexToSvg('(\\d{3})-(\\d{4})', 'g')

// Step by step (more control). parseRegex returns { ok, ast, issues }:
const r = parseRegex(source, flags)
if (r.ok) {
  const diagram = buildDiagram(r.ast) // positioned diagram model
  const svg2 = renderToSvg(diagram) // diagram → static SVG
}

// Build a valid regex literal from a source + flags (escapes `/`, handles empties):
toRegexLiteral('a/b', 'g') // → "/a\/b/g"
toRegexLiteral('', '') // → "/(?:)/"
```

## 📖 API

A quick map — see the **[full API reference](https://nowo.github.io/regex/docs/api)** for details.

| Function | Purpose |
| --- | --- |
| `regexToSvg(source, flags?)` | One-shot: regex → standalone SVG string (or `null`) |
| `parseRegex(source, flags?)` | Parse to an AST and validate — `{ ok, ast, issues }` |
| `lintRegex(source, flags?)` | Semantic issues only |
| `explainRegex(source, flags?)` | Token-by-token, plain-language steps |
| `formatExplain(desc, messages?)` | Render an explanation step, localizable |
| `buildDiagram(ast)` · `renderToSvg(diagram, flags?)` | Lower-level layout + render |
| `toRegexLiteral(source, flags?)` | Assemble a valid `/…/flags` literal |

## 🙏 Acknowledgements

Inspired by [regulex](https://github.com/CJex/regulex) and [regex101](https://regex101.com/).

## 📄 License

[MIT](./LICENSE) © 2026 nowo
