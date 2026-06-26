# Changelog


## v0.0.1


### 🚀 Enhancements

- **core:** Visualize v-flag set classes and back-references ([704f2bb](https://github.com/nowo/regex/commit/704f2bb))
- **core:** Add toRegexLiteral helper ([7d27e83](https://github.com/nowo/regex/commit/7d27e83))
- **playground:** Paste-split literals and copy the regex ([1b728ff](https://github.com/nowo/regex/commit/1b728ff))
- **core:** Expose capture index on group nodes ([361277f](https://github.com/nowo/regex/commit/361277f))
- **playground:** Test panel with per-line JS method results ([8cf35aa](https://github.com/nowo/regex/commit/8cf35aa))
- **core:** Add explainRegex ([3126f44](https://github.com/nowo/regex/commit/3126f44))
- **playground:** Explanation and method-aware JS code panels ([f07f639](https://github.com/nowo/regex/commit/f07f639))
- **diagram:** Add syntax-colored source band and unified color palette ([2be1c28](https://github.com/nowo/regex/commit/2be1c28))
- **diagram:** Show full /pattern/flags literal in source band, bold ([2562cef](https://github.com/nowo/regex/commit/2562cef))
- **syntax:** Color character-class entries in reference and explanation panels ([7cb243f](https://github.com/nowo/regex/commit/7cb243f))
- **diagram:** Render source band as one selectable text run for clean copy ([232b36e](https://github.com/nowo/regex/commit/232b36e))
- **playground:** Highlight the diagram node under the input caret ([1c5ba3d](https://github.com/nowo/regex/commit/1c5ba3d))
- **playground:** Syntax-highlight the regex input field in place ([1e971f4](https://github.com/nowo/regex/commit/1e971f4))
- **playground:** Focus-triggered flags picker, emphasize copy-regex button ([1e74f6c](https://github.com/nowo/regex/commit/1e74f6c))
- **core:** Fold semantic linting into parseRegex ([8c5de06](https://github.com/nowo/regex/commit/8c5de06))
- **playground:** Block broken regexes from the diagram and export ([6af56dd](https://github.com/nowo/regex/commit/6af56dd))
- **playground:** Localize examples and add an API docs page ([0ba4cbb](https://github.com/nowo/regex/commit/0ba4cbb))
- **playground:** Syntax-highlight docs with nuxt-shiki and expand the usage page ([72fe0bf](https://github.com/nowo/regex/commit/72fe0bf))
- **playground:** Syntax-highlight the JS code panel with shiki ([48316fc](https://github.com/nowo/regex/commit/48316fc))
- **core:** Render explanations from a message table via formatExplain ([cc86ade](https://github.com/nowo/regex/commit/cc86ade))
- **playground:** Localize the explanation panel with a translation table ([79a4f92](https://github.com/nowo/regex/commit/79a4f92))
- **playground:** Replace the usage page with a @nuxt/content docs site ([2df7095](https://github.com/nowo/regex/commit/2df7095))

### 🩹 Fixes

- **playground:** Pointer cursor on buttons ([f1496b8](https://github.com/nowo/regex/commit/f1496b8))
- **core:** Color character-class entries by kind in source band and hover ([8982d19](https://github.com/nowo/regex/commit/8982d19))
- **diagram:** Add top padding above source band so the regex isn't flush to the edge ([5b2693a](https://github.com/nowo/regex/commit/5b2693a))
- **playground:** Collapse the docs nav link to an icon on mobile ([919f82f](https://github.com/nowo/regex/commit/919f82f))
- **playground:** Make the favicon baseURL-aware for sub-path deploys ([1ed0c8b](https://github.com/nowo/regex/commit/1ed0c8b))
- **core:** Strip the article from character-set members inside a class ([0301a5f](https://github.com/nowo/regex/commit/0301a5f))
- **playground:** Normalize the base URL trailing slash for the favicon ([6e031f6](https://github.com/nowo/regex/commit/6e031f6))
- **playground:** Add @types/node so nuxt.config typechecks ([6b72ae5](https://github.com/nowo/regex/commit/6b72ae5))

### 💅 Refactors

- **playground:** Drop redundant regex header, move copy button to toolbar ([6331e4d](https://github.com/nowo/regex/commit/6331e4d))
- **playground:** Align example patterns with eslint-plugin-regexp ([c68ba7f](https://github.com/nowo/regex/commit/c68ba7f))
- **core:** Rename charclass node kind to chars ([faef29e](https://github.com/nowo/regex/commit/faef29e))
- **playground:** Drive syntax reference labels from computed i18n ([11c82f9](https://github.com/nowo/regex/commit/11c82f9))
- **core:** Extract source analysis out of the renderer ([9349fe6](https://github.com/nowo/regex/commit/9349fe6))

### 📖 Documentation

- **core:** Link the README to the online docs ([d9f7ac3](https://github.com/nowo/regex/commit/d9f7ac3))
- **playground:** Expand the usage page with types and theming sections ([0bac4d2](https://github.com/nowo/regex/commit/0bac4d2))
- **core:** Point the README to the new docs site URL ([d9f7f06](https://github.com/nowo/regex/commit/d9f7f06))

### 🏡 Chore

- **init:** Initial commit — regex railroad-diagram visualizer ([ae17910](https://github.com/nowo/regex/commit/ae17910))
- **eslint:** Tune vue formatting rules ([3daaddc](https://github.com/nowo/regex/commit/3daaddc))
- **eslint:** Switch to @wzo/eslint-config ([f41a0c5](https://github.com/nowo/regex/commit/f41a0c5))
- **vscode:** Configure i18n-ally for the monorepo ([13f58a6](https://github.com/nowo/regex/commit/13f58a6))

### 🤖 CI

- Add Pages deploy and npm release workflows with a root release script ([a335d80](https://github.com/nowo/regex/commit/a335d80))

### ❤️ Contributors

- Nowo ([@nowo](https://github.com/nowo))

