<div align="center">

<img src="https://raw.githubusercontent.com/nowo/regex/main/packages/playground/public/favicon.svg" width="76" height="76" alt="regex logo" />

# regex

**Modern regular-expression railroad-diagram visualizer.**<br>
A modern parser plus a custom railroad layout engine — named groups, lookbehind,
`\p{}`, named backreferences and the `v` flag, with a built-in syntax reference.

[![npm version](https://img.shields.io/npm/v/@wzo/regex-diagram.svg?color=10b981&label=npm)](https://www.npmjs.com/package/@wzo/regex-diagram)
[![license](https://img.shields.io/npm/l/@wzo/regex-diagram?color=10b981)](./LICENSE)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node-%E2%89%A516.6-5FA04E?logo=node.js&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white)

**[Live playground →](https://nowo.github.io/regex)** · **[Docs](https://nowo.github.io/regex/docs/getting-started)**

<p align="center"><b>English</b> | <a href="./README.zh.md">简体中文</a></p>

</div>

---

## 📦 Packages

| Package | Description |
| --- | --- |
| **[`@wzo/regex-diagram`](./packages/core)** | The visualizer library — **pure TypeScript, framework-agnostic**, depends only on `@eslint-community/regexpp` and `regexp-ast-analysis`. Outputs a diagram model and an optional static SVG. Published to npm. |
| **[`playground`](./packages/playground)** | Nuxt 4 site that consumes `core` and adds interactivity (hover highlight, click-to-insert), a syntax reference, examples and full docs. Deployed to GitHub Pages. |

## 🛠 Develop

```bash
pnpm install
pnpm build      # build the core library
pnpm test       # run core tests
pnpm play:dev   # run the playground locally
```

## 🙏 Acknowledgements

Inspired by [regulex](https://github.com/CJex/regulex) and [regex101](https://regex101.com/).

## 📄 License

[MIT](./LICENSE) © 2026 nowo
