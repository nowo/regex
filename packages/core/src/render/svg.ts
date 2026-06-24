import type { Diagram, LayoutNode } from '../layout/nodes'
import type { SyntaxCategory } from '../syntax'
import { buildDiagram } from '../layout/measure'
import { GEO } from '../layout/nodes'
import { parseRegex } from '../parse'

const ESC_RE = /[&<>"]/g

// Source-band geometry. Char width matches the diagram's own monospace metric so
// the band lines up under the nodes; each char sits in a fixed cell for exact
// highlight alignment regardless of the rendering font's real advance.
const SRC = { cw: GEO.charW, ch: 22, gap: 12, x: GEO.pad }

const STYLE = `<style>
.rr-diagram{font-family:ui-sans-serif,system-ui,sans-serif}
.rr-rail{fill:none;stroke:var(--rr-rail,#94a3b8);stroke-width:1.6}
.rr-quant-rail{fill:none;stroke:var(--rr-syntax-quantifier,#c026d3);stroke-width:1.6}
.rr-quant-arrow{fill:var(--rr-syntax-quantifier,#c026d3);stroke:none}
.rr-box{stroke-width:1.4}
.rr-hit{fill:transparent;pointer-events:fill;cursor:pointer}
.rr-node{cursor:pointer}
.rr-cat-literal{--rr-hl-c:var(--rr-syntax-literal,#3b82f6)}
.rr-cat-charset{--rr-hl-c:var(--rr-syntax-charset,#16a34a)}
.rr-cat-class{--rr-hl-c:var(--rr-syntax-class,#d97706)}
.rr-cat-anchor{--rr-hl-c:var(--rr-syntax-anchor,#8b5cf6)}
.rr-cat-quantifier{--rr-hl-c:var(--rr-syntax-quantifier,#c026d3)}
.rr-cat-group{--rr-hl-c:var(--rr-syntax-group,#e11d48)}
.rr-cat-lookaround{--rr-hl-c:var(--rr-syntax-lookaround,#ea580c)}
.rr-cat-backref{--rr-hl-c:var(--rr-syntax-backref,#0d9488)}
.rr-cat-alternation{--rr-hl-c:var(--rr-syntax-alternation,#64748b)}
.rr-active>.rr-node .rr-box,.rr-active>.rr-group,.rr-active>.rr-class-box,.rr-active>.rr-class-item,.rr-active>.rr-count-box,.rr-active>.rr-quant-rail,.rr-active>.rr-quant-arrow{filter:drop-shadow(0 0 3px var(--rr-hl-c,#10b981)) drop-shadow(0 0 var(--rr-syntax-glow,9px) var(--rr-hl-c,#10b981))}
.rr-active>.rr-node .rr-box,.rr-active>.rr-group,.rr-active>.rr-class-box,.rr-active>.rr-class-item,.rr-active>.rr-count-box{stroke-width:3}
.rr-active>.rr-rail,.rr-active>.rr-quant-rail{stroke:var(--rr-hl-c,#10b981);stroke-width:2.6}
.rr-active>.rr-quant-arrow{fill:var(--rr-hl-c,#10b981)}
.rr-text{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13.5px;fill:var(--rr-text,#0f172a)}
.rr-text-on{fill:var(--rr-text-on,#ffffff)}
.rr-literal{fill:var(--rr-literal-bg,#dbeafe);stroke:var(--rr-literal-bd,#60a5fa)}
.rr-charset{fill:var(--rr-charset-bg,#16a34a);stroke:var(--rr-charset-bd,#15803d)}
.rr-anchor{fill:var(--rr-anchor-bg,#7c3aed);stroke:var(--rr-anchor-bd,#6d28d9)}
.rr-backref{fill:var(--rr-backref-bg,#0d9488);stroke:var(--rr-backref-bd,#0f766e)}
.rr-group{fill:transparent;stroke:var(--rr-group,#cbd5e1);stroke-width:1.5;cursor:pointer}
.rr-group-capture,.rr-group-group{stroke:var(--rr-syntax-group,#e11d48)}
.rr-group-lookahead,.rr-group-lookbehind{stroke:var(--rr-syntax-lookaround,#ea580c)}
.rr-count-box{fill:none;stroke:var(--rr-syntax-quantifier,#c026d3);stroke-width:1.5;stroke-dasharray:5 4}
.rr-class-box{fill:var(--rr-class-bg,#fef9c3);stroke:var(--rr-class-border,#eab308);stroke-width:1.5;cursor:pointer}
.rr-class-box-negated{stroke:var(--rr-class-negated-border,#f43f5e);stroke-dasharray:5 4}
.rr-class-item{stroke-width:1.4}
.rr-class-item-literal{fill:var(--rr-literal-bg,#dbeafe);stroke:var(--rr-literal-bd,#60a5fa)}
.rr-class-item-set{fill:var(--rr-charset-bg,#16a34a);stroke:var(--rr-charset-bd,#15803d)}
.rr-cap-start{fill:var(--rr-cap-start,#22c55e);stroke:var(--rr-cap-start-bd,#16a34a);stroke-width:1.5}
.rr-cap-end{fill:var(--rr-cap-end,#475569);stroke:var(--rr-cap-end-bd,#334155);stroke-width:1.5}
.rr-group-label,.rr-class-header{font-size:11px;fill:var(--rr-muted,#64748b)}
.rr-count{font-size:11px;fill:var(--rr-syntax-quantifier,#c026d3);font-weight:600}
.rr-link{fill:none;stroke:var(--rr-backref-bd,#0d9488);stroke-width:1.4;stroke-dasharray:4 3;opacity:.8}
.rr-link-arrow{fill:var(--rr-backref-bd,#0d9488);opacity:.8}
.rr-src-text{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:14px;font-weight:600;fill:var(--rr-text,#0f172a)}
.rr-src-flags{font-weight:400}
.rr-src-hit{fill:transparent;pointer-events:fill;cursor:pointer}
.rr-src-literal>.rr-src-text{fill:var(--rr-syntax-literal,#3b82f6)}
.rr-src-charset>.rr-src-text{fill:var(--rr-syntax-charset,#16a34a)}
.rr-src-class>.rr-src-text{fill:var(--rr-syntax-class,#d97706)}
.rr-src-anchor>.rr-src-text{fill:var(--rr-syntax-anchor,#8b5cf6)}
.rr-src-quantifier>.rr-src-text{fill:var(--rr-syntax-quantifier,#c026d3)}
.rr-src-group>.rr-src-text{fill:var(--rr-syntax-group,#e11d48)}
.rr-src-lookaround>.rr-src-text{fill:var(--rr-syntax-lookaround,#ea580c)}
.rr-src-backref>.rr-src-text{fill:var(--rr-syntax-backref,#0d9488)}
.rr-src-alternation>.rr-src-text{fill:var(--rr-syntax-alternation,#64748b)}
.rr-src-on>.rr-src-hit{fill:var(--rr-hl-line,#10b981);fill-opacity:var(--rr-syntax-hl-opacity,.18)}
.rr-src-literal.rr-src-on>.rr-src-hit{fill:var(--rr-syntax-literal,#3b82f6)}
.rr-src-charset.rr-src-on>.rr-src-hit{fill:var(--rr-syntax-charset,#16a34a)}
.rr-src-class.rr-src-on>.rr-src-hit{fill:var(--rr-syntax-class,#d97706)}
.rr-src-anchor.rr-src-on>.rr-src-hit{fill:var(--rr-syntax-anchor,#8b5cf6)}
.rr-src-quantifier.rr-src-on>.rr-src-hit{fill:var(--rr-syntax-quantifier,#c026d3)}
.rr-src-group.rr-src-on>.rr-src-hit{fill:var(--rr-syntax-group,#e11d48)}
.rr-src-lookaround.rr-src-on>.rr-src-hit{fill:var(--rr-syntax-lookaround,#ea580c)}
.rr-src-backref.rr-src-on>.rr-src-hit{fill:var(--rr-syntax-backref,#0d9488)}
.rr-src-alternation.rr-src-on>.rr-src-hit{fill:var(--rr-syntax-alternation,#64748b)}
</style>`

/**
 * Render a laid-out diagram to a standalone SVG string.
 *
 * Colors use CSS custom properties with sensible fallbacks, so the output works
 * on its own yet can be themed (e.g. dark mode) by the host via `--rr-*` vars.
 */
export function renderToSvg(diagram: Diagram, flags = ''): string {
    const body: string[] = []

    for (const d of diagram.rails) {
        body.push(`<path class="rr-rail" d="${d}"/>`)
    }
    for (const link of diagram.links) {
        body.push(`<path class="rr-link" d="${link.path}"/><path class="rr-link-arrow" d="${link.arrow}"/>`)
    }
    for (const cap of diagram.caps) {
        body.push(renderCap(cap))
    }
    body.push(`<g transform="translate(${diagram.rootX},${diagram.rootY})">${renderNode(diagram.root)}</g>`)

    const { band, bandH, bandW } = renderSourceBand(diagram, flags)
    const content = `${band}<g transform="translate(0,${round(bandH)})">${body.join('')}</g>`

    const w = round(Math.max(diagram.width, bandW))
    const h = round(diagram.height + bandH)
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="rr-diagram">${STYLE}${content}</svg>`
}

/** A source-character range `[s, e)` paired with the node category that colors it. */
interface Span { s: number, e: number, cat?: SyntaxCategory }

/**
 * Render the full regex literal — `/pattern/flags` — as a token-colored band above
 * the diagram. Each pattern char gets its own `<g>` carrying `data-i` (for
 * diagram→source highlight) and the range of its smallest enclosing node (for
 * source→diagram hover linking); the framing slashes and the flags are plain,
 * non-interactive glyphs. `data-start`/`data-i` stay relative to the pattern, so
 * the leading slash only shifts where each char is drawn, not what it maps to.
 */
function renderSourceBand(diagram: Diagram, flags: string): { band: string, bandH: number, bandW: number } {
    const src = diagram.source
    const ranges: Span[] = []
    const colors: Span[] = []
    collectSpans(diagram.root, ranges, colors)

    const ty = round(SRC.ch * 0.72)
    const midX = (col: number): number => round(SRC.x + col * SRC.cw + SRC.cw / 2)
    // A plain framing glyph (the slashes / flags around the pattern).
    const plain = (col: number, ch: string): string => `<text class="rr-src-text" x="${midX(col)}" y="${ty}" text-anchor="middle">${esc(ch)}</text>`

    const cells: string[] = [plain(0, '/')]
    for (let i = 0; i < src.length; i++) {
        const col = i + 1 // shifted right by the leading slash
        const owner = smallest(ranges, i)
        const cat = smallest(colors, i)?.cat
        const range = owner ? { s: owner.s, e: owner.e } : { s: i, e: i + 1 }
        // Hit rect first (below the glyph) so the hover tint sits behind colored text.
        const cls = cat ? `rr-src-char rr-src-${cat}` : 'rr-src-char'
        const hit = `<rect class="rr-src-hit" x="${round(SRC.x + col * SRC.cw)}" y="0" width="${round(SRC.cw)}" height="${SRC.ch}" rx="3"/>`
        const text = `<text class="rr-src-text" x="${midX(col)}" y="${ty}" text-anchor="middle">${esc(src[i]!)}</text>`
        cells.push(`<g class="${cls}" data-i="${i}" data-start="${range.s}" data-end="${range.e}">${hit}${text}</g>`)
    }
    let col = src.length + 1
    cells.push(plain(col++, '/'))
    for (const f of flags) {
        // flags are not bolded — only the pattern body and its slashes are
        cells.push(`<text class="rr-src-text rr-src-flags" x="${midX(col++)}" y="${ty}" text-anchor="middle">${esc(f)}</text>`)
    }

    const cols = src.length + 2 + flags.length
    return {
        band: `<g class="rr-src">${cells.join('')}</g>`,
        bandH: SRC.ch + SRC.gap,
        bandW: round(SRC.x * 2 + cols * SRC.cw),
    }
}

/**
 * Per-character syntax categories for a regex source — the same coloring the
 * diagram's source band uses (including character-class entries split into
 * charset/literal), exposed so other views can color the same regex identically.
 * Returns null if the pattern (or flags) fail to parse; an entry is null for a
 * character with no specific category (e.g. structural punctuation).
 */
export function sourceColors(source: string, flags = ''): (SyntaxCategory | null)[] | null {
    const parsed = parseRegex(source, flags)
    if (!parsed.ok) {
        return null
    }
    const ranges: Span[] = []
    const colors: Span[] = []
    collectSpans(buildDiagram(parsed.ast).root, ranges, colors)
    return Array.from({ length: source.length }, (_, i) => smallest(colors, i)?.cat ?? null)
}

/** Collect node source-ranges (for hover linking) and colored token spans (for the band). */
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

/** The syntax-coloring category for a node, or undefined if it should stay neutral. */
function colorCat(node: LayoutNode): SyntaxCategory | undefined {
    switch (node.kind) {
        case 'terminal':
            return node.cls
        case 'charclass':
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

function renderNode(node: LayoutNode): string {
    const parts: string[] = []

    for (const d of node.paths) {
        parts.push(`<path class="rr-rail" d="${d}"/>`)
    }
    if (node.accents) {
        for (const d of node.accents) {
            parts.push(`<path class="rr-quant-rail" d="${d}"/>`)
        }
    }
    if (node.decorations) {
        for (const dec of node.decorations) {
            parts.push(`<path class="rr-quant-arrow" d="${dec.d}"/>`)
        }
    }

    if (node.countBox) {
        const b = node.countBox
        parts.push(`<rect class="rr-count-box" x="${round(b.x)}" y="${round(b.y)}" width="${round(b.w)}" height="${round(b.h)}" rx="7"/>`)
    }

    if (node.kind === 'terminal') {
        parts.push(renderTerminal(node))
    } else if (node.kind === 'group') {
        parts.push(renderGroup(node))
    } else if (node.kind === 'charclass') {
        parts.push(renderCharClass(node))
    }

    if (node.texts) {
        for (const t of node.texts) {
            parts.push(`<text class="rr-${t.cls}" x="${round(t.x)}" y="${round(t.y)}" text-anchor="${t.anchor}">${esc(t.content)}</text>`)
        }
    }

    for (const c of node.children) {
        parts.push(`<g transform="translate(${round(c.x)},${round(c.y)})">${renderNode(c.node)}</g>`)
    }

    const inner = parts.join('')
    // Wrap nodes that map to a source range so the UI can highlight the input on hover.
    // Most nodes are hovered via their own filled box / transparent group frame.
    // A quantifier (repeat) has no fillable box — only lines and a label — so give it
    // a transparent surface over its whole region, otherwise only the thin lines (or,
    // for a dashed count frame, the enclosing group) would catch the hover.
    if (node.start != null && node.end != null) {
        const hit = node.kind === 'repeat'
            ? `<rect class="rr-hit" x="0" y="0" width="${round(node.width)}" height="${round(node.height)}"/>`
            : ''
        // Capturing groups also carry their index so the UI can link them to match groups.
        const group = node.refId != null ? ` data-group="${node.refId}"` : ''
        // The category class sets --rr-hl-c, so the hover glow takes this node's own syntax color.
        const cat = colorCat(node)
        const cls = cat ? ` class="rr-cat-${cat}"` : ''
        return `<g${cls} data-start="${node.start}" data-end="${node.end}"${group}>${hit}${inner}</g>`
    }
    return inner
}

// Solid-fill boxes use light (white) text; outlined boxes use dark text.
const LIGHT_TEXT = new Set(['charset', 'anchor', 'backref'])

function renderTerminal(node: LayoutNode): string {
    const rx = node.cls === 'charset' ? node.height / 2 : 6
    const textCls = LIGHT_TEXT.has(node.cls ?? '') ? 'rr-text rr-text-on' : 'rr-text'
    const box = `<rect class="rr-box rr-${node.cls}" x="0" y="0" width="${round(node.width)}" height="${round(node.height)}" rx="${round(rx)}"/>`
    const text = `<text class="${textCls}" x="${round(node.width / 2)}" y="${round(node.railY)}" text-anchor="middle" dominant-baseline="central">${esc(node.label ?? '')}</text>`
    const title = node.title ? `<title>${esc(node.title)}</title>` : ''
    return `<g class="rr-node">${title}${box}${text}</g>`
}

function renderGroup(node: LayoutNode): string {
    const dashed = node.groupStyle !== 'capture' ? ' stroke-dasharray="5 4"' : ''
    const title = node.title ? `<title>${esc(node.title)}</title>` : ''
    return `${title}<rect class="rr-group rr-group-${node.groupStyle}" x="0" y="0" width="${round(node.width)}" height="${round(node.height)}" rx="8"${dashed}/>`
}

function renderCharClass(node: LayoutNode): string {
    const parts: string[] = []
    if (node.box) {
        const b = node.box
        const negated = node.negate ? ' rr-class-box-negated' : ''
        parts.push(`<rect class="rr-class-box${negated}" x="${round(b.x)}" y="${round(b.y)}" width="${round(b.w)}" height="${round(b.h)}" rx="8"/>`)
    }
    for (const it of node.items ?? []) {
        const title = it.title ? `<title>${esc(it.title)}</title>` : ''
        const rx = it.cls === 'set' ? it.h / 2 : 5
        const textCls = it.cls === 'set' ? 'rr-text rr-text-on' : 'rr-text'
        const data = it.start != null && it.end != null ? ` data-start="${it.start}" data-end="${it.end}"` : ''
        // Hover glow follows the entry's kind (charset/literal), matching its box color.
        const catClass = it.cls === 'set' ? 'rr-cat-charset' : 'rr-cat-literal'
        parts.push(
            `<g class="rr-node ${catClass}"${data}>${title}`
            + `<rect class="rr-class-item rr-class-item-${it.cls}" x="${round(it.x)}" y="${round(it.y)}" width="${round(it.w)}" height="${round(it.h)}" rx="${round(rx)}"/>`
            + `<text class="${textCls}" x="${round(it.x + it.w / 2)}" y="${round(it.y + it.h / 2)}" text-anchor="middle" dominant-baseline="central">${esc(it.label)}</text>`
            + `</g>`,
        )
    }
    return parts.join('')
}

function renderCap(cap: { x: number, y: number, kind: 'start' | 'end' }): string {
    const x = round(cap.x)
    const y = round(cap.y)
    if (cap.kind === 'start') {
        return `<circle class="rr-cap-start" cx="${x}" cy="${y}" r="6"/>`
    }
    return `<circle class="rr-cap-end" cx="${x}" cy="${y}" r="6"/>`
}

function esc(s: string): string {
    return s.replace(ESC_RE, c => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;'))
}

function round(n: number): number {
    return Math.round(n * 100) / 100
}
