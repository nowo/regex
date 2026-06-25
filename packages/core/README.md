# @wzo/regex-diagram

> Framework-agnostic regular-expression **railroad-diagram** visualizer.
> Pure TypeScript, depends only on `@eslint-community/regexpp`.

[简体中文](./README.zh.md)

Parse a regular expression with a modern parser, lay it out as a railroad
diagram, and render it to SVG — including modern syntax such as named groups,
lookbehind, `\p{}`, named backreferences and the `v` flag.

**▶ Interactive playground & full API docs: <https://nowo.github.io/regex/usage>**

## Install

```bash
pnpm add @wzo/regex-diagram
```

## Usage

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

## Acknowledgements

Inspired by [regulex](https://github.com/CJex/regulex) and [regex101](https://regex101.com/).

## License

[MIT](./LICENSE) © 2026 nowo
