# regex

> Modern regular-expression **railroad-diagram** visualizer — a modern parser
> plus a custom railroad layout engine, supporting syntax such as named groups,
> lookbehind, `\p{}`, named backreferences and the `v` flag, with a built-in
> Chinese syntax reference.

[简体中文](./README.zh.md)

## Monorepo

```
regex/
├── packages/
│   ├── core/         # @wzo/regex-diagram — framework-agnostic library (parse + layout + render)
│   └── playground/   # Nuxt 4 site — interactive online playground + docs
```

- **`packages/core`** — the visualizer library, **pure TypeScript, framework-agnostic**,
  depending only on `@eslint-community/regexpp`. Outputs a diagram model and an optional
  static SVG string. Published to npm as `@wzo/regex-diagram`.
- **`packages/playground`** — a Nuxt 4 site that consumes `core` and adds interactivity
  (hover highlight, click-to-insert), a syntax reference, and examples. Deployed to GitHub Pages.

## Develop

```bash
pnpm install
pnpm build        # build the core library
pnpm test         # run core tests
pnpm play:dev     # run the playground locally
```

## Acknowledgements

Inspired by [regulex](https://github.com/CJex/regulex) and [regex101](https://regex101.com/).

## License

[MIT](./LICENSE) © 2026 nowo
