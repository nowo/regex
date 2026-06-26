# @wzo/regex-diagram

> 框架无关的正则**铁路图**（railroad diagram）可视化库。
> 纯 TypeScript，仅依赖 `@eslint-community/regexpp`。

[English](./README.md)

用现代解析器解析正则、布局成铁路图、渲染为 SVG —— 支持命名组、后行断言、`\p{}`、
具名反向引用、`v` flag 等现代语法。

**▶ 在线 playground 与完整 API 文档：<https://nowo.github.io/regex/docs/getting-started>**

## 安装

```bash
pnpm add @wzo/regex-diagram
```

## 用法

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

## 致谢

灵感来自 [regulex](https://github.com/CJex/regulex) 与 [regex101](https://regex101.com/)。

## 许可

[MIT](./LICENSE) © 2026 nowo
