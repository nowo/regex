import type { LayoutNode } from './layout/nodes'
import type { SyntaxCategory } from './syntax'
import { buildDiagram } from './layout/measure'
import { parseRegex } from './parse'

/**
 * Per-character analysis of a pattern: its syntax category (for coloring) and the
 * range of the smallest node covering it (for source↔diagram hover linking).
 */
export interface CharInfo {
    cat: SyntaxCategory | null
    range: readonly [number, number] | null
}

/** A source-character range `[s, e)` paired with the node category that colors it. */
interface Span { s: number, e: number, cat?: SyntaxCategory }

/** The syntax-coloring category for a node, or undefined if it should stay neutral. */
export function colorCat(node: LayoutNode): SyntaxCategory | undefined {
    switch (node.kind) {
        case 'terminal':
            return node.cls
        case 'chars':
            return 'class'
        case 'group':
            return node.groupStyle === 'lookahead' || node.groupStyle === 'lookbehind' ? 'lookaround' : 'group'
        case 'repeat':
            return 'quantifier'
        case 'choice':
            return 'alternation'
        default:
            return undefined
    }
}

/** Collect node source-ranges (for hover linking) and colored token spans (for coloring). */
function collectSpans(node: LayoutNode, ranges: Span[], colors: Span[]): void {
    if (node.start != null && node.end != null) {
        ranges.push({ s: node.start, e: node.end })
        // Color by syntax. Because the narrowest covering span wins, an enclosing
        // node only tints the characters its children don't: a group tints just its
        // `(`, `)` and `(?<name>` prefix; a quantifier tints its `+ * ? {n}`; an
        // alternation tints its `|`. Inner literals/classes keep their own color.
        const cat = colorCat(node)
        if (cat) {
            colors.push({ s: node.start, e: node.end, cat })
        }
    }
    for (const it of node.items ?? []) {
        if (it.start != null && it.end != null) {
            ranges.push({ s: it.start, e: it.end })
            // Color class entries by kind, mirroring the diagram's item boxes:
            // shorthand sets (\d \w \s …) read as charset, everything else as a literal.
            // The enclosing `[...]` keeps the class color on its brackets (narrowest span wins).
            colors.push({ s: it.start, e: it.end, cat: it.cls === 'set' ? 'charset' : 'literal' })
        }
    }
    for (const c of node.children) {
        collectSpans(c.node, ranges, colors)
    }
}

/** The narrowest span covering index `i`, or undefined if none does. */
function smallest(spans: Span[], i: number): Span | undefined {
    let best: Span | undefined
    for (const sp of spans) {
        if (sp.s <= i && i < sp.e && (!best || sp.e - sp.s < best.e - best.s)) {
            best = sp
        }
    }
    return best
}

/** Per-character {@link CharInfo} for an already-laid-out diagram root. */
export function analyzeRoot(root: LayoutNode, length: number): CharInfo[] {
    const ranges: Span[] = []
    const colors: Span[] = []
    collectSpans(root, ranges, colors)
    return Array.from({ length }, (_, i) => {
        const owner = smallest(ranges, i)
        return { cat: smallest(colors, i)?.cat ?? null, range: owner ? ([owner.s, owner.e] as const) : null }
    })
}

function analyze(source: string, flags: string): CharInfo[] | null {
    const parsed = parseRegex(source, flags)
    return parsed.ok ? analyzeRoot(buildDiagram(parsed.ast).root, source.length) : null
}

/**
 * Per-character syntax categories for a regex source — the same coloring the
 * diagram's source band uses (including character-class entries split into
 * charset/literal), exposed so other views can color the same regex identically.
 * Returns null if the pattern (or flags) fail to parse.
 */
export function sourceColors(source: string, flags = ''): (SyntaxCategory | null)[] | null {
    return analyze(source, flags)?.map(c => c.cat) ?? null
}

/**
 * Per-character owner range — the smallest node `[start, end)` covering each
 * character — so a caret position in the input can be mapped to a diagram node.
 * Returns null if the pattern (or flags) fail to parse.
 */
export function sourceRanges(source: string, flags = ''): (readonly [number, number] | null)[] | null {
    return analyze(source, flags)?.map(c => c.range) ?? null
}
