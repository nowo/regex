# @wzo/regex-diagram

> Framework-agnostic regular-expression **railroad-diagram** visualizer.
> Pure TypeScript, depends only on `@eslint-community/regexpp`.

[简体中文](./README.zh.md)

Parse a regular expression with a modern parser, lay it out as a railroad
diagram, and render it to SVG — including modern syntax such as named groups,
lookbehind, `\p{}`, named backreferences and the `v` flag.

> **Status: scaffolding.** The parse → layout → render pipeline lands across the
> upcoming phases (see `DESIGN.md`). The API below is the target shape.

## Install

```bash
pnpm add @wzo/regex-diagram
```

## Usage

```ts
import { buildDiagram, parseRegex, regexToSvg, renderToSvg } from '@wzo/regex-diagram'

// One-shot: regex → SVG string
const svg = regexToSvg('(\\d{3})-(\\d{4})', 'g')

// Step by step (more control):
const r = parseRegex(source, flags) // AST | error
const diagram = buildDiagram(r.ast) // { nodes, edges, width, height }
const svg2 = renderToSvg(diagram) // diagram → static SVG
```

## Acknowledgements

Inspired by [regulex](https://github.com/CJex/regulex) and [regex101](https://regex101.com/).

## License

[MIT](./LICENSE) © 2026 nowo
