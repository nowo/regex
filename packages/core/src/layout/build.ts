import type { AST } from '@eslint-community/regexpp'
import type { CCEntry, CCSet, RailNode } from './nodes'

/**
 * Convert a regexpp Pattern AST into a structural railroad tree.
 * Pure structure — no geometry. See DESIGN.md §6 for the mapping table.
 */
export function astToRail(pattern: AST.Pattern): RailNode {
    const captureIndex = indexCapturingGroups(pattern)
    return mapAlternatives(pattern.alternatives, captureIndex)
}

/** `a|b|c` → choice; a single alternative → sequence. */
function mapAlternatives(alternatives: AST.Alternative[], capIdx: Map<AST.CapturingGroup, number>): RailNode {
    if (alternatives.length === 1) {
        return mapAlternative(alternatives[0]!, capIdx)
    }
    return { kind: 'choice', branches: alternatives.map(alt => mapAlternative(alt, capIdx)) }
}

function mapAlternative(alt: AST.Alternative, capIdx: Map<AST.CapturingGroup, number>): RailNode {
    const items = mapElements(alt.elements, capIdx)
    if (items.length === 0) {
        return { kind: 'wire' }
    }
    if (items.length === 1) {
        return items[0]!
    }
    return { kind: 'seq', items }
}

/** Map a run of elements, merging consecutive literal characters into one box (e.g. `abc`). */
function mapElements(elements: readonly AST.Element[], capIdx: Map<AST.CapturingGroup, number>): RailNode[] {
    const out: RailNode[] = []
    let run: string[] = []
    let runStart = 0
    let runEnd = 0
    const flush = (): void => {
        if (run.length > 0) {
            out.push({ kind: 'terminal', label: run.join(''), cls: 'literal', start: runStart, end: runEnd })
            run = []
        }
    }
    for (const el of elements) {
        if (el.type === 'Character') {
            if (run.length === 0) {
                runStart = el.start
            }
            runEnd = el.end
            run.push(charLabel(el))
        } else {
            flush()
            out.push(mapElement(el, capIdx))
        }
    }
    flush()
    return out
}

function mapElement(el: AST.Element, capIdx: Map<AST.CapturingGroup, number>): RailNode {
    switch (el.type) {
        case 'Character':
            return { kind: 'terminal', label: charLabel(el), cls: 'literal', start: el.start, end: el.end }

        case 'CharacterSet':
            return { kind: 'terminal', label: charSetLabel(el), cls: 'charset', title: el.raw, start: el.start, end: el.end }

        case 'CharacterClass':
        case 'ExpressionCharacterClass':
            return { kind: 'charclass', set: classSet(el), start: el.start, end: el.end }

        case 'Assertion':
            return mapAssertion(el, capIdx)

        case 'Quantifier':
            return mapQuantifier(el, capIdx)

        case 'CapturingGroup':
            return {
                kind: 'group',
                style: 'capture',
                label: groupLabel(el, capIdx),
                body: mapAlternatives(el.alternatives, capIdx),
                start: el.start,
                end: el.end,
                refId: capIdx.get(el),
            }

        case 'Group':
            return {
                kind: 'group',
                style: 'group',
                label: 'group',
                body: mapAlternatives(el.alternatives, capIdx),
                start: el.start,
                end: el.end,
            }

        case 'Backreference': {
            const resolved = Array.isArray(el.resolved) ? el.resolved[0] : el.resolved
            const refTarget = resolved ? capIdx.get(resolved) : undefined
            return { kind: 'terminal', label: el.raw, cls: 'backref', title: 'back-reference', start: el.start, end: el.end, refTarget }
        }

        default:
            // Should be unreachable for valid patterns; show the raw source as a fallback.
            return { kind: 'terminal', label: (el as { raw?: string }).raw ?? '?', cls: 'literal' }
    }
}

type ClassElement = AST.CharacterClass['elements'][number]

/** A character class or `v`-flag expression class → a (possibly nested) set tree. */
function classSet(el: AST.CharacterClass | AST.ExpressionCharacterClass): CCSet {
    if (el.type === 'ExpressionCharacterClass') {
        return exprSet(el)
    }
    return {
        kind: 'set',
        header: el.negate ? 'None of:' : 'One of:',
        negate: el.negate,
        items: classElements(el.elements),
        start: el.start,
        end: el.end,
    }
}

/** Map class elements, merging consecutive literal characters into one entry (e.g. `-.`). */
function classElements(elements: readonly ClassElement[]): CCEntry[] {
    const out: CCEntry[] = []
    let run: string[] = []
    let runStart = 0
    let runEnd = 0
    const flush = (): void => {
        if (run.length > 0) {
            out.push({ kind: 'leaf', label: run.join(''), cls: 'literal', start: runStart, end: runEnd })
            run = []
        }
    }
    for (const e of elements) {
        if (e.type === 'Character') {
            if (run.length === 0) {
                runStart = e.start
            }
            runEnd = e.end
            run.push(charLabel(e))
        } else {
            flush()
            out.push(classEntry(e))
        }
    }
    flush()
    return out
}

function classEntry(e: ClassElement): CCEntry {
    switch (e.type) {
        case 'Character':
            return { kind: 'leaf', label: charLabel(e), cls: 'literal', start: e.start, end: e.end }
        case 'CharacterClassRange':
            return { kind: 'leaf', label: `${charLabel(e.min)}-${charLabel(e.max)}`, cls: 'literal', start: e.start, end: e.end }
        case 'CharacterSet':
            return { kind: 'leaf', label: charSetLabel(e), cls: 'set', title: e.raw, start: e.start, end: e.end }
        case 'CharacterClass':
        case 'ExpressionCharacterClass':
            return classSet(e)
        case 'ClassStringDisjunction':
            return {
                kind: 'set',
                header: 'One of:',
                items: e.alternatives.map(s => ({
                    kind: 'leaf' as const,
                    label: s.elements.map(c => charLabel(c)).join('') || '(empty)',
                    cls: 'literal' as const,
                    start: s.start,
                    end: s.end,
                })),
                start: e.start,
                end: e.end,
            }
        default:
            return { kind: 'leaf', label: (e as { raw?: string }).raw ?? '?', cls: 'literal' }
    }
}

/** A `v`-flag operation class (`&&` / `--`) → a set whose header names the operation. */
function exprSet(el: AST.ExpressionCharacterClass): CCSet {
    const expr = el.expression
    let header: string
    let operands: ClassElement[]
    if (expr.type === 'ClassIntersection') {
        header = el.negate ? 'Not all of:' : 'All of:'
        operands = flattenOp(expr, 'ClassIntersection')
    } else if (expr.type === 'ClassSubtraction') {
        header = el.negate ? 'Not (A − B):' : 'Subtract (A − B):'
        operands = flattenOp(expr, 'ClassSubtraction')
    } else {
        header = el.negate ? 'None of:' : 'One of:'
        operands = [expr as ClassElement]
    }
    return {
        kind: 'set',
        header,
        negate: el.negate,
        items: operands.map(classEntry),
        start: el.start,
        end: el.end,
    }
}

/** Flatten a left-associative chain of the same operator into a flat operand list. */
function flattenOp(expr: AST.ClassIntersection | AST.ClassSubtraction, type: 'ClassIntersection' | 'ClassSubtraction'): ClassElement[] {
    const out: ClassElement[] = []
    const walk = (e: AST.ClassIntersection | AST.ClassSubtraction | AST.ClassSetOperand): void => {
        if (e.type === type) {
            walk((e as AST.ClassIntersection | AST.ClassSubtraction).left)
            out.push((e as AST.ClassIntersection | AST.ClassSubtraction).right as ClassElement)
        } else {
            out.push(e as ClassElement)
        }
    }
    walk(expr)
    return out
}

function mapAssertion(el: AST.Assertion, capIdx: Map<AST.CapturingGroup, number>): RailNode {
    switch (el.kind) {
        case 'start':
            return { kind: 'terminal', label: 'Begin!', cls: 'anchor', title: 'start (^)', start: el.start, end: el.end }
        case 'end':
            return { kind: 'terminal', label: 'End!', cls: 'anchor', title: 'end ($)', start: el.start, end: el.end }
        case 'word':
            return { kind: 'terminal', label: el.negate ? 'Not Word Boundary' : 'Word Boundary', cls: 'anchor', title: el.raw, start: el.start, end: el.end }
        case 'lookahead':
            return {
                kind: 'group',
                style: 'lookahead',
                label: el.negate ? 'negative lookahead' : 'lookahead',
                body: mapAlternatives(el.alternatives, capIdx),
                start: el.start,
                end: el.end,
            }
        case 'lookbehind':
            return {
                kind: 'group',
                style: 'lookbehind',
                label: el.negate ? 'negative lookbehind' : 'lookbehind',
                body: mapAlternatives(el.alternatives, capIdx),
                start: el.start,
                end: el.end,
            }
    }
}

function mapQuantifier(el: AST.Quantifier, capIdx: Map<AST.CapturingGroup, number>): RailNode {
    const { min, max, greedy } = el
    const inf = max === Number.POSITIVE_INFINITY
    const body = mapElement(el.element, capIdx)

    // {1} is a no-op repetition — just render the atom.
    if (!inf && min === 1 && max === 1) {
        return body
    }

    let count: string
    if (inf) {
        count = min === 0 ? '0 or more times' : min === 1 ? '1 or more times' : `${min} or more times`
    } else if (min === 0 && max === 1) {
        count = 'optional'
    } else if (min === max) {
        count = `${min} times`
    } else {
        count = `${min} to ${max} times`
    }
    if (!greedy) {
        count += ' (lazy)'
    }

    return {
        kind: 'repeat',
        body,
        label: count,
        bypass: min === 0, // can be skipped
        loop: inf, // unbounded → loop-back arc
        countBox: !inf && max > 1, // bounded count → dashed frame
        start: el.start,
        end: el.end,
    }
}

function charLabel(el: AST.Character): string {
    if (el.value === 0x20) {
        return '␣' // visible space
    }
    if (el.value < 0x20) {
        return el.raw // control char — keep the escape (e.g. \n, \t)
    }
    // Show the actual character, not the escaped source (`\(` → `(`, `\.` → `.`).
    return String.fromCodePoint(el.value)
}

/** Friendly, regulex-style names for character sets. */
function charSetLabel(el: AST.CharacterSet): string {
    switch (el.kind) {
        case 'any':
            return 'Any'
        case 'digit':
            return el.negate ? 'Not Digit' : 'Digit'
        case 'word':
            return el.negate ? 'Not Word' : 'Word'
        case 'space':
            return el.negate ? 'Not WhiteSpace' : 'WhiteSpace'
        case 'property':
            return el.raw
    }
}

function groupLabel(el: AST.CapturingGroup, capIdx: Map<AST.CapturingGroup, number>): string {
    const i = capIdx.get(el)
    const base = i != null ? `Group #${i}` : 'Group'
    return el.name ? `${base}: ${el.name}` : base
}

/** Assign 1-based capture indices in source order. */
export function indexCapturingGroups(pattern: AST.Pattern): Map<AST.CapturingGroup, number> {
    const map = new Map<AST.CapturingGroup, number>()
    let i = 0

    // Function declarations (hoisted) so the mutual recursion needs no forward ref.
    function walkAlt(alt: AST.Alternative): void {
        alt.elements.forEach(walkEl)
    }
    function walkEl(el: AST.Element): void {
        switch (el.type) {
            case 'CapturingGroup':
                map.set(el, ++i)
                el.alternatives.forEach(walkAlt)
                break
            case 'Group':
                el.alternatives.forEach(walkAlt)
                break
            case 'Quantifier':
                walkEl(el.element)
                break
            case 'Assertion':
                if (el.kind === 'lookahead' || el.kind === 'lookbehind') {
                    el.alternatives.forEach(walkAlt)
                }
                break
            default:
                break
        }
    }

    pattern.alternatives.forEach(walkAlt)
    return map
}
