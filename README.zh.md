<div align="center">

<img src="https://raw.githubusercontent.com/nowo/regex/main/packages/playground/public/favicon.svg" width="76" height="76" alt="regex logo" />

# regex

**现代化的正则铁路图（railroad diagram）可视化工具。**<br>
用现代解析器加自实现的铁路图布局引擎 —— 支持命名组、后行断言、`\p{}`、具名反向引用、
`v` flag 等现代语法，并内置语法参考。

[![npm version](https://img.shields.io/npm/v/@wzo/regex-diagram.svg?color=10b981&label=npm)](https://www.npmjs.com/package/@wzo/regex-diagram)
[![license](https://img.shields.io/npm/l/@wzo/regex-diagram?color=10b981)](./LICENSE)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node-%E2%89%A516.6-5FA04E?logo=node.js&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white)

**[在线 playground →](https://nowo.github.io/regex)** · **[文档](https://nowo.github.io/regex/docs/getting-started)**

<p align="center"><a href="./README.md">English</a> | <b>简体中文</b></p>

</div>

---

## 📦 包

| 包 | 说明 |
| --- | --- |
| **[`@wzo/regex-diagram`](./packages/core)** | 可视化库 —— **纯 TypeScript、框架无关**，仅依赖 `@eslint-community/regexpp` 与 `regexp-ast-analysis`。输出图模型和可选的静态 SVG。已发布到 npm。 |
| **[`playground`](./packages/playground)** | Nuxt 4 站，基于 `core` 加入交互（hover 高亮、点击插入）、语法参考、示例库和完整文档。部署到 GitHub Pages。 |

## 🛠 开发

```bash
pnpm install
pnpm build      # 构建核心库
pnpm test       # 运行 core 测试
pnpm play:dev   # 本地运行 playground
```

## 🙏 致谢

灵感来自 [regulex](https://github.com/CJex/regulex) 与 [regex101](https://regex101.com/)。

## 📄 许可

[MIT](./LICENSE) © 2026 nowo
