import type { Diagram, LayoutNode } from '../layout/nodes'

const ESC_RE = /[&<>"]/g

const STYLE = `<style>
.rr-diagram{font-family:ui-sans-serif,system-ui,sans-serif}
.rr-rail{fill:none;stroke:var(--rr-rail,#94a3b8);stroke-width:1.6}
.rr-arrow{fill:var(--rr-rail,#94a3b8);stroke:none}
.rr-box{stroke-width:1.4}
.rr-hit{fill:transparent;pointer-events:fill;cursor:pointer}
.rr-node{cursor:pointer}
.rr-active>.rr-node .rr-box,.rr-active>.rr-group,.rr-active>.rr-class-box,.rr-active>.rr-class-item,.rr-active>.rr-count-box{stroke-width:3;filter:drop-shadow(0 0 3px var(--rr-hl,rgba(16,185,129,.6)))}
.rr-active>.rr-rail{stroke:var(--rr-hl-line,#10b981);stroke-width:2.6}
.rr-active>.rr-arrow{fill:var(--rr-hl-line,#10b981)}
.rr-text{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13.5px;fill:var(--rr-text,#0f172a)}
.rr-text-on{fill:var(--rr-text-on,#ffffff)}
.rr-literal{fill:var(--rr-literal-bg,#dbeafe);stroke:var(--rr-literal-bd,#60a5fa)}
.rr-charset{fill:var(--rr-charset-bg,#16a34a);stroke:var(--rr-charset-bd,#15803d)}
.rr-anchor{fill:var(--rr-anchor-bg,#7c3aed);stroke:var(--rr-anchor-bd,#6d28d9)}
.rr-backref{fill:var(--rr-backref-bg,#0d9488);stroke:var(--rr-backref-bd,#0f766e)}
.rr-group{fill:transparent;stroke:var(--rr-group,#cbd5e1);stroke-width:1.5;cursor:pointer}
.rr-group-capture{stroke:var(--rr-group-capture,#10b981)}
.rr-group-lookahead,.rr-group-lookbehind{stroke:var(--rr-group-look,#f59e0b)}
.rr-count-box{fill:none;stroke:var(--rr-count-border,#f43f5e);stroke-width:1.5;stroke-dasharray:5 4}
.rr-class-box{fill:var(--rr-class-bg,#fef9c3);stroke:var(--rr-class-border,#eab308);stroke-width:1.5;cursor:pointer}
.rr-class-box-negated{stroke:var(--rr-class-negated-border,#f43f5e);stroke-dasharray:5 4}
.rr-class-item{stroke-width:1.4}
.rr-class-item-literal{fill:var(--rr-literal-bg,#dbeafe);stroke:var(--rr-literal-bd,#60a5fa)}
.rr-class-item-set{fill:var(--rr-charset-bg,#16a34a);stroke:var(--rr-charset-bd,#15803d)}
.rr-cap-start{fill:var(--rr-cap-start,#22c55e);stroke:var(--rr-cap-start-bd,#16a34a);stroke-width:1.5}
.rr-cap-end{fill:var(--rr-cap-end,#475569);stroke:var(--rr-cap-end-bd,#334155);stroke-width:1.5}
.rr-group-label,.rr-count,.rr-class-header{font-size:11px;fill:var(--rr-muted,#64748b)}
.rr-link{fill:none;stroke:var(--rr-backref-bd,#0d9488);stroke-width:1.4;stroke-dasharray:4 3;opacity:.8}
.rr-link-arrow{fill:var(--rr-backref-bd,#0d9488);opacity:.8}
</style>`

/**
 * Render a laid-out diagram to a standalone SVG string.
 *
 * Colors use CSS custom properties with sensible fallbacks, so the output works
 * on its own yet can be themed (e.g. dark mode) by the host via `--rr-*` vars.
 */
export function renderToSvg(diagram: Diagram): string {
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

    const w = round(diagram.width)
    const h = round(diagram.height)
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="rr-diagram">${STYLE}${body.join('')}</svg>`
}

function renderNode(node: LayoutNode): string {
    const parts: string[] = []

    for (const d of node.paths) {
        parts.push(`<path class="rr-rail" d="${d}"/>`)
    }
    if (node.decorations) {
        for (const dec of node.decorations) {
            parts.push(`<path class="rr-arrow" d="${dec.d}"/>`)
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
        return `<g data-start="${node.start}" data-end="${node.end}">${hit}${inner}</g>`
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
        parts.push(
            `<g class="rr-node"${data}>${title}`
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
