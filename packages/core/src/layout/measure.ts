import type { AST } from '@eslint-community/regexpp'
import type { Diagram, LayoutNode, RailNode } from './nodes'
import { astToRail } from './build'
import { GEO } from './nodes'

/**
 * Build a fully laid-out diagram from a regexpp Pattern AST.
 * Maps AST → railroad tree (build.ts), measures it, and wraps it with the
 * outer padding, lead-in/out rails and start/end caps.
 */
export function buildDiagram(pattern: AST.Pattern): Diagram {
    const root = layout(astToRail(pattern))
    const { pad, lead } = GEO

    const rootX = pad + lead
    const rootY = pad
    const railY = pad + root.railY
    const width = root.width + lead * 2 + pad * 2
    const height = root.height + pad * 2

    return {
        width,
        height,
        railY,
        root,
        rootX,
        rootY,
        rails: [
            `M${pad},${railY} H${rootX}`,
            `M${rootX + root.width},${railY} H${width - pad}`,
        ],
        caps: [
            { x: pad, y: railY, kind: 'start' },
            { x: width - pad, y: railY, kind: 'end' },
        ],
    }
}

/** Recursively measure a structural rail node into a positioned layout node. */
export function layout(node: RailNode): LayoutNode {
    switch (node.kind) {
        case 'terminal':
            return measureTerminal(node)
        case 'wire':
            return measureWire()
        case 'seq':
            return measureSeq(node.items.map(layout))
        case 'choice':
            return measureChoice(node.branches.map(layout))
        case 'repeat':
            return measureRepeat(layout(node.body), node)
        case 'group':
            return measureGroup(layout(node.body), node)
        case 'charclass':
            return measureCharClass(node)
    }
}

function measureTerminal(node: Extract<RailNode, { kind: 'terminal' }>): LayoutNode {
    const width = Math.max(GEO.minBoxW, node.label.length * GEO.charW + GEO.padX * 2)
    return {
        kind: 'terminal',
        width,
        height: GEO.boxH,
        railY: GEO.boxH / 2,
        children: [],
        paths: [],
        label: node.label,
        cls: node.cls,
        title: node.title,
        start: node.start,
        end: node.end,
    }
}

function measureWire(): LayoutNode {
    const width = GEO.hGap * 2
    const railY = GEO.boxH / 2
    return {
        kind: 'wire',
        width,
        height: GEO.boxH,
        railY,
        children: [],
        paths: [`M0,${railY} H${width}`],
    }
}

function measureSeq(items: LayoutNode[]): LayoutNode {
    if (items.length === 0) {
        return measureWire()
    }
    if (items.length === 1) {
        return items[0]!
    }

    const railY = Math.max(...items.map(it => it.railY))
    const below = Math.max(...items.map(it => it.height - it.railY))
    const height = railY + below

    const children: LayoutNode['children'] = []
    const paths: string[] = []
    let x = 0
    let prevRight: number | null = null

    for (const it of items) {
        if (prevRight != null) {
            paths.push(`M${prevRight},${railY} H${x}`)
        }
        children.push({ x, y: railY - it.railY, node: it })
        prevRight = x + it.width
        x = prevRight + GEO.hGap
    }

    return { kind: 'seq', width: prevRight!, height, railY, children, paths }
}

function measureChoice(branches: LayoutNode[]): LayoutNode {
    if (branches.length === 1) {
        return branches[0]!
    }

    const { choiceCurveW: cw, vGap } = GEO
    const innerW = Math.max(...branches.map(b => b.width))
    const width = cw + innerW + cw

    const children: LayoutNode['children'] = []
    const paths: string[] = []

    // Stack branches vertically, recording each one's absolute rail line.
    const tops: number[] = []
    let y = 0
    for (const b of branches) {
        tops.push(y)
        y += b.height + vGap
    }
    const height = y - vGap
    const railY = height / 2

    branches.forEach((b, i) => {
        const top = tops[i]!
        const branchRail = top + b.railY
        children.push({ x: cw, y: top, node: b })
        // fork in
        paths.push(sCurve(0, railY, cw, branchRail))
        // pad shorter branches out to the common right edge
        if (b.width < innerW) {
            paths.push(`M${cw + b.width},${branchRail} H${cw + innerW}`)
        }
        // join out
        paths.push(sCurve(cw + innerW, branchRail, width, railY))
    })

    return { kind: 'choice', width, height, railY, children, paths }
}

function measureRepeat(body: LayoutNode, node: Extract<RailNode, { kind: 'repeat' }>): LayoutNode {
    const { repeatSide: side, skipH, loopArc, labelH, labelCharW, countPad: cp } = GEO
    const arc = 7 // corner radius for the bypass / loop-back routing
    const skipY = 2 // y of the bypass line, in the reserved top band

    // A bounded count wraps the body in a dashed frame, enlarging its footprint.
    const frameW = body.width + (node.countBox ? cp * 2 : 0)
    const frameH = body.height + (node.countBox ? cp * 2 : 0)

    const topMargin = node.bypass ? skipH : 0
    // Widen to fit the (wordy) count label so it never overlaps neighbours.
    const labelW = node.label.length * labelCharW + 12
    const width = Math.max(frameW + side * 2, labelW)
    const frameX = (width - frameW) / 2
    const bodyX = frameX + (node.countBox ? cp : 0)
    const railY = topMargin + (node.countBox ? cp : 0) + body.railY
    const frameBottom = topMargin + frameH
    const loopY = frameBottom + loopArc // y of the loop-back line
    const height = (node.loop ? loopY : frameBottom) + labelH

    const sx = frameX
    const ex = frameX + frameW
    // The bypass / loop-back legs run OUTSIDE the body box (in the side margin) so
    // they never overlap a tall body such as an expanded character class.
    const bxL = frameX - side / 2
    const bxR = ex + side / 2

    const children: LayoutNode['children'] = [{ x: bodyX, y: topMargin + (node.countBox ? cp : 0), node: body }]
    const paths: string[] = [
        `M0,${railY} H${sx}`,
        `M${ex},${railY} H${width}`,
    ]
    const decorations: LayoutNode['decorations'] = []

    if (node.loop) {
        // Loop-back below the body (right → left), rounded rectangular routing.
        paths.push(`M${bxR},${railY} V${loopY - arc} a${arc} ${arc} 0 0 1 ${-arc} ${arc} H${bxL + arc} a${arc} ${arc} 0 0 1 ${-arc} ${-arc} V${railY}`)
        decorations.push({ d: arrowLeft(width / 2, loopY) })
    }
    if (node.bypass) {
        // Bypass over the body (left → right), rounded rectangular routing.
        paths.push(`M${bxL},${railY} V${skipY + arc} a${arc} ${arc} 0 0 1 ${arc} ${-arc} H${bxR - arc} a${arc} ${arc} 0 0 1 ${arc} ${arc} V${railY}`)
    }

    return {
        kind: 'repeat',
        width,
        height,
        railY,
        children,
        paths,
        decorations,
        start: node.start,
        end: node.end,
        countBox: node.countBox ? { x: frameX, y: topMargin, w: frameW, h: frameH } : undefined,
        texts: [{ x: width / 2, y: height - 2, content: node.label, anchor: 'middle', cls: 'count' }],
    }
}

function measureGroup(body: LayoutNode, node: Extract<RailNode, { kind: 'group' }>): LayoutNode {
    const { groupPadX: px, groupPadTop: pt, groupPadBottom: pb, groupLabelH: lh, labelCharW } = GEO
    // The frame must fit the wider of the body and the label, so labels like
    // "negative lookbehind" don't spill past a narrow body.
    const labelW = node.label.length * labelCharW + px * 2
    const width = Math.max(body.width + px * 2, labelW)
    const height = pt + body.height + pb
    const railY = pt + body.railY
    const bodyX = (width - body.width) / 2

    return {
        kind: 'group',
        width,
        height,
        railY,
        groupStyle: node.style,
        title: node.title,
        start: node.start,
        end: node.end,
        children: [{ x: bodyX, y: pt, node: body }],
        paths: [
            `M0,${railY} H${bodyX}`,
            `M${bodyX + body.width},${railY} H${width}`,
        ],
        texts: [{ x: width / 2, y: lh, content: node.label, anchor: 'middle', cls: 'grouplabel' }],
    }
}

function measureCharClass(node: Extract<RailNode, { kind: 'charclass' }>): LayoutNode {
    const { ccHeaderH: hh, ccPadX: px, ccPadY: pv, ccItemH: ih, ccItemGap: ig, ccItemPadX: ipx, ccMinItemW: miw, charW } = GEO
    const n = node.items.length
    const innerW = Math.max(miw, ...node.items.map(it => it.label.length * charW + ipx * 2))
    const width = innerW + px * 2

    const contentH = n * ih + (n - 1) * ig
    const boxH = pv * 2 + contentH
    const boxTop = hh
    const height = boxTop + boxH
    const railY = boxTop + boxH / 2

    const items = node.items.map((it, i) => ({
        x: px,
        y: boxTop + pv + i * (ih + ig),
        w: innerW,
        h: ih,
        label: it.label,
        cls: it.cls,
        title: it.title,
        start: it.start,
        end: it.end,
    }))

    return {
        kind: 'charclass',
        width,
        height,
        railY,
        children: [],
        paths: [],
        negate: node.negate,
        start: node.start,
        end: node.end,
        box: { x: 0, y: boxTop, w: width, h: boxH },
        items,
        texts: [{ x: width / 2, y: hh - 5, content: node.header, anchor: 'middle', cls: 'cchead' }],
    }
}

/** Smooth S-curve with horizontal tangents at both ends. */
function sCurve(x1: number, y1: number, x2: number, y2: number): string {
    const mx = (x1 + x2) / 2
    return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`
}

/** Small left-pointing filled triangle, centred at (x, y). */
function arrowLeft(x: number, y: number): string {
    return `M${x + 4},${y - 4} L${x - 4},${y} L${x + 4},${y + 4} Z`
}
