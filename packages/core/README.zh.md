# @wzo/regex-diagram

> 框架无关的正则**铁路图**（railroad diagram）可视化库。
> 纯 TypeScript，仅依赖 `@eslint-community/regexpp`。

[English](./README.md)

用现代解析器解析正则、布局成铁路图、渲染为 SVG —— 支持命名组、后行断言、`\p{}`、
具名反向引用、`v` flag 等现代语法。

> **状态：脚手架阶段。** parse → layout → render 整条 pipeline 将在后续阶段逐步落地
> （见 `DESIGN.md`）。下方 API 为目标形态。

## 安装

```bash
pnpm add @wzo/regex-diagram
```

## 用法

```ts
import { buildDiagram, parseRegex, regexToSvg, renderToSvg } from '@wzo/regex-diagram'

// 一站式：正则 → SVG 字符串
const svg = regexToSvg('(\\d{3})-(\\d{4})', 'g')

// 分步（更灵活）：
const r = parseRegex(source, flags) // AST | error
const diagram = buildDiagram(r.ast) // { nodes, edges, width, height }
const svg2 = renderToSvg(diagram) // 图结构 → 静态 SVG
```

## 致谢

灵感来自 [regulex](https://github.com/CJex/regulex) 与 [regex101](https://regex101.com/)。

## 许可

[MIT](./LICENSE) © 2026 nowo
