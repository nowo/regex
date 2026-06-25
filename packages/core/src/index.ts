// @wzo/regex-diagram — framework-agnostic regular-expression railroad-diagram visualizer
//
// Pipeline (see DESIGN.md §4):
//   regex string + flags  ──①Parse──▶  RegExp AST  ──②Layout──▶  Diagram model  ──③Render──▶  SVG

import { buildDiagram } from './layout/measure'
import { parseRegex } from './parse'
import { renderToSvg } from './render/svg'

export { sourceColors, sourceRanges } from './analyze'
export { explainRegex } from './explain'
export type { ExplainItem } from './explain'
export { buildDiagram } from './layout/measure'
export type { Diagram, GroupStyle, LayoutNode, RailNode, TerminalClass } from './layout/nodes'
export { toRegexLiteral } from './literal'
export { lintRegex, parseRegex } from './parse'
export type { ParseFailure, ParseResult, ParseSuccess, RegexIssue } from './parse'
export { renderToSvg } from './render/svg'
export type { SyntaxCategory } from './syntax'

/**
 * One-shot: regex source + flags → SVG string.
 * Returns `null` if the regex fails to parse OR has semantic issues (a broken
 * regex shouldn't yield a diagram) — use {@link parseRegex} for the details.
 */
export function regexToSvg(source: string, flags = ''): string | null {
    const parsed = parseRegex(source, flags)
    if (!parsed.ok || parsed.issues.length > 0) {
        return null
    }
    return renderToSvg(buildDiagram(parsed.ast), flags)
}
