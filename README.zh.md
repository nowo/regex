# regex

> 现代化的正则**铁路图**（railroad diagram）可视化工具 —— 用现代解析器加自实现的
> 铁路图布局引擎，支持命名组、后行断言、`\p{}`、具名反向引用、`v` flag 等现代语法，
> 并内置中文语法参考。

[English](./README.md)

## Monorepo

```
regex/
├── packages/
│   ├── core/         # @wzo/regex-diagram —— 框架无关的核心库（parse + layout + render）
│   └── playground/   # Nuxt 4 站 —— 在线交互 playground + 文档
```

- **`packages/core`** —— 可视化库，**纯 TypeScript、框架无关**，仅依赖
  `@eslint-community/regexpp`。输出图结构和可选的静态 SVG 字符串。以
  `@wzo/regex-diagram` 发布到 npm。
- **`packages/playground`** —— Nuxt 4 站，消费 `core` 并加入交互（hover 高亮、
  点击插入）、语法参考、示例库。部署到 GitHub Pages。

## 开发

```bash
pnpm install
pnpm build        # 构建核心库
pnpm test         # 运行 core 测试
pnpm play:dev     # 本地运行 playground
```

## 致谢

灵感来自 [regulex](https://github.com/CJex/regulex) 与 [regex101](https://regex101.com/)。

## 许可

[MIT](./LICENSE) © 2026 nowo
