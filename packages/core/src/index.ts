// @wzo/regex-diagram — framework-agnostic regular-expression railroad-diagram visualizer
//
// Pipeline (see DESIGN.md §4):
//   regex string + flags  ──①Parse──▶  RegExp AST  ──②Layout──▶  Diagram model  ──③Render──▶  SVG

import { buildDiagram } from './layout/measure'
import { parseRegex } from './parse'
import { renderToSvg } from './render/svg'

export { explainRegex } from './explain'
export type { ExplainItem } from './explain'
export { buildDiagram } from './layout/measure'
export type { Diagram, GroupStyle, LayoutNode, RailNode, TerminalClass } from './layout/nodes'
export { toRegexLiteral } from './literal'
export { parseRegex } from './parse'
export type { ParseFailure, ParseResult, ParseSuccess } from './parse'
export { renderToSvg } from './render/svg'

/**
 * One-shot: regex source + flags → SVG string.
 * Returns `null` if the pattern (or flags) fail to parse — use {@link parseRegex}
 * directly when you need the error message and position.
 */
export function regexToSvg(source: string, flags = ''): string | null {
    const parsed = parseRegex(source, flags)
    if (!parsed.ok) {
        return null
    }
    return renderToSvg(buildDiagram(parsed.ast))
}
