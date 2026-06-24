// Railroad node model — two layers:
//   RailNode  : structural tree mapped from the regexpp AST (no geometry)
//   LayoutNode: measured tree with sizes, child offsets and connector paths
//
// See DESIGN.md §4 (pipeline) and §6 (AST → railroad mapping).

/** Visual class of a terminal box, drives styling in the renderer. */
export type TerminalClass = 'literal' | 'charset' | 'anchor' | 'backref'

/** Visual class of a group frame. */
export type GroupStyle = 'capture' | 'group' | 'lookahead' | 'lookbehind'

/** Visual class of a character-class entry: a literal/range box vs a named set pill. */
export type ItemClass = 'literal' | 'set'

/** A leaf entry in a character class: a literal/range box or a named-set pill. */
export interface CCLeaf {
    kind: 'leaf'
    label: string
    cls: ItemClass
    title?: string
    /** Source range `[start, end)` in the pattern, for input highlighting. */
    start?: number
    end?: number
}

/**
 * A (possibly nested) character-class set: the top-level `[...]`, a nested class,
 * a `v`-flag operation (`&&` / `--`), or a `\q{}` string disjunction.
 */
export interface CCSet {
    kind: 'set'
    header: string // 'One of:' | 'None of:' | 'All of:' | 'Subtract:' | …
    items: CCEntry[]
    negate?: boolean
    start?: number
    end?: number
}

export type CCEntry = CCLeaf | CCSet

/**
 * A repeat's three independent decorations:
 *  - bypass:   a skip line over the body (min === 0, e.g. `?` `*`)
 *  - loop:     a loop-back arc under the body (unbounded, e.g. `*` `+`)
 *  - countBox: a dashed frame around the body for a bounded count (e.g. `{3}` `{2,5}`)
 */
export type RailNode
    = | { kind: 'terminal', label: string, cls: TerminalClass, title?: string, start?: number, end?: number, refTarget?: number }
        | { kind: 'wire' } // an empty sequence (epsilon) — drawn as a straight line
        | { kind: 'seq', items: RailNode[] }
        | { kind: 'choice', branches: RailNode[], start?: number, end?: number }
        | { kind: 'repeat', body: RailNode, label: string, bypass: boolean, loop: boolean, countBox: boolean, start?: number, end?: number }
        | { kind: 'group', body: RailNode, label: string, style: GroupStyle, title?: string, start?: number, end?: number, refId?: number }
        // A character class `[...]`, expanded into a (possibly nested) set tree.
        | { kind: 'chars', set: CCSet, start?: number, end?: number }

/** A child node placed at a local offset within its parent. */
export interface Placed {
    x: number
    y: number
    node: LayoutNode
}

/** A free-floating text label (used for quantifier counts and group names). */
export interface TextItem {
    x: number
    y: number
    content: string
    anchor: 'start' | 'middle' | 'end'
    cls: 'count' | 'group-label' | 'class-header'
}

/** A measured character-class entry (a small box with its own label). */
export interface PlacedItem {
    x: number
    y: number
    w: number
    h: number
    label: string
    cls: ItemClass
    title?: string
    start?: number
    end?: number
}

/** A filled decoration (arrowheads on loop-back rails). */
export interface Decoration {
    d: string
}

/**
 * Measured railroad node. Geometry is in the node's own local coordinate space
 * (origin at its top-left). `railY` is the y of the entry/exit rail line, so the
 * entry point is `(0, railY)` and the exit point is `(width, railY)`.
 */
export interface LayoutNode {
    kind: RailNode['kind']
    width: number
    height: number
    railY: number
    children: Placed[]
    /** Connector path `d` strings (stroked, no fill), in local coordinates. */
    paths: string[]
    /** Quantifier loop/bypass arcs — stroked in the quantifier color, not the rail color. */
    accents?: string[]
    /** Terminal/group label, drawn by the renderer per `cls`/`groupStyle`. */
    label?: string
    cls?: TerminalClass
    groupStyle?: GroupStyle
    title?: string
    texts?: TextItem[]
    decorations?: Decoration[]
    /** Source range `[start, end)` in the pattern, for input highlighting. */
    start?: number
    end?: number
    /** Capture index this group exposes (for back-reference links). */
    refId?: number
    /** Capture index a back-reference points at (for back-reference links). */
    refTarget?: number
    /** Container box for a character class (the framed region below its header). */
    box?: { x: number, y: number, w: number, h: number }
    /** Dashed count frame for a bounded repeat (e.g. `{3}`). */
    countBox?: { x: number, y: number, w: number, h: number }
    /** Character-class entries, stacked vertically inside `box`. */
    items?: PlacedItem[]
    negate?: boolean
}

/** Top-level laid-out diagram, ready to render. */
export interface Diagram {
    width: number
    height: number
    railY: number
    root: LayoutNode
    rootX: number
    rootY: number
    /** The original pattern source, drawn as a token-colored band atop the diagram. */
    source: string
    /** Lead-in / lead-out rail segments in diagram coordinates. */
    rails: string[]
    /** Start (left) and end (right) terminal caps. */
    caps: { x: number, y: number, kind: 'start' | 'end' }[]
    /** Back-reference connector arcs (back-reference → target group), diagram coords. */
    links: { path: string, arrow: string }[]
}

/** Geometry constants — tuned visually; see RailroadDiagram in the playground. */
export const GEO = {
    boxH: 28, // terminal box height
    charW: 8.4, // approx monospace advance at the rendered font size
    labelCharW: 6.6, // approx sans-serif advance for group/count labels
    minBoxW: 22,
    padX: 11, // terminal text horizontal padding
    hGap: 14, // gap between sequence items
    vGap: 12, // gap between choice branches
    choiceCurveW: 26, // horizontal room for fork/join curves
    repeatSide: 16, // horizontal room for loop / bypass legs (kept clear of the body)
    skipH: 16, // vertical room for a skip (bypass) arch
    loopArc: 16, // vertical depth of a loop-back arch
    labelH: 14, // vertical room for a quantifier count label
    groupPadX: 11,
    groupLabelH: 17,
    groupPadTop: 23, // groupLabelH + breathing room
    groupPadBottom: 9,
    ccHeaderH: 17, // "One of:" header height above a character-class box
    ccPadX: 9, // character-class box horizontal padding
    ccPadY: 8, // character-class box vertical padding
    ccItemH: 24, // character-class entry box height
    ccItemGap: 6, // gap between stacked entries
    ccItemPadX: 11, // entry text horizontal padding
    ccMinItemW: 34,
    countPad: 7, // padding between a bounded-repeat body and its dashed frame
    pad: 18, // outer diagram padding
    lead: 22, // lead-in/out rail length at the diagram ends
    capR: 5, // start/end cap radius
} as const
