import type { AST } from '@eslint-community/regexpp'
import type { SyntaxCategory } from './syntax'
import { indexCapturingGroups } from './layout/build'
import { parseRegex } from './parse'

/**
 * A character set, as a data shape (shorthand `\d`/`\w`/`\s`/`.` or a Unicode
 * property). Reused both as a top-level token and as a member of a class.
 */
export type CharSetDesc
    = | { set: 'any' }
        | { set: 'digit', negate: boolean }
        | { set: 'word', negate: boolean }
        | { set: 'space', negate: boolean }
        | { set: 'property', raw: string }

/** A member of a bracketed character class, as a data shape. */
export type ClassMember
    = | { type: 'char', value: string }
        | { type: 'range', min: string, max: string }
        | { type: 'set', set: CharSetDesc }

/**
 * Language-neutral description of one explanation line. Switch on `kind` to
 * render it, or pass it to {@link formatExplain} with a message table. The
 * English `ExplainItem.text` is itself rendered this way, so the two never drift.
 */
export type ExplainDesc
    = | { kind: 'char', value: string }
        | { kind: 'space' }
        | { kind: 'text', value: string }
        | ({ kind: 'charset' } & CharSetDesc)
        | { kind: 'class', negate: boolean, members: ClassMember[] }
        | { kind: 'classExpr' }
        | { kind: 'anchor', at: 'start' | 'end' | 'word', negate?: boolean }
        | { kind: 'lookaround', dir: 'ahead' | 'behind', negate: boolean }
        | { kind: 'quantifier', min: number, max: number, greedy: boolean }
        | { kind: 'group', capturing: boolean, index?: number, name?: string }
        | { kind: 'backref', index?: number }
        | { kind: 'option', n: number }

/**
 * The message table {@link formatExplain} renders from. Every value is a
 * template string with `{placeholder}` slots. Localize by passing a partial
 * table — any key you omit falls back to the built-in English ({@link EXPLAIN_EN}).
 */
export interface ExplainMessages {
    char: string // {value}
    space: string
    text: string // {value}
    csAny: string
    csDigit: string
    csDigitNeg: string
    csWord: string
    csWordNeg: string
    csSpace: string
    csSpaceNeg: string
    csProperty: string // {raw}
    classEmpty: string
    classEmptyNeg: string
    classOneOf: string // {parts}
    classExcept: string // {parts}
    listSep: string // joins class members
    classExpr: string
    anchorStart: string
    anchorEnd: string
    wordBoundary: string
    notWordBoundary: string
    followedBy: string
    notFollowedBy: string
    precededBy: string
    notPrecededBy: string
    qStar: string
    qPlus: string
    qMin: string // {min}
    qOptional: string
    qExact: string // {n}
    qRange: string // {min} {max}
    lazy: string // {base}
    groupNamed: string // {index} {name}
    group: string // {index}
    groupNonCapturing: string
    backref: string
    backrefTo: string // {index}
    option: string // {n}
    withColon: string // {text} — wraps a line that has children below it
}

/** Built-in English message table; the default for {@link formatExplain}. */
export const EXPLAIN_EN: ExplainMessages = {
    char: 'the character "{value}"',
    space: 'a space',
    text: 'the text "{value}"',
    csAny: 'any character (except line breaks)',
    csDigit: 'a digit (0-9)',
    csDigitNeg: 'any non-digit',
    csWord: 'a word character (letter, digit, or underscore)',
    csWordNeg: 'a non-word character',
    csSpace: 'a whitespace character',
    csSpaceNeg: 'a non-whitespace character',
    csProperty: 'a character with Unicode property {raw}',
    classEmpty: 'nothing',
    classEmptyNeg: 'any character',
    classOneOf: 'one of: {parts}',
    classExcept: 'any character except: {parts}',
    listSep: ', ',
    classExpr: 'a set-operation character class (see the diagram)',
    anchorStart: 'the start of the string (or line with the m flag)',
    anchorEnd: 'the end of the string (or line with the m flag)',
    wordBoundary: 'a word boundary',
    notWordBoundary: 'a position that is not a word boundary',
    followedBy: 'followed by',
    notFollowedBy: 'not followed by',
    precededBy: 'preceded by',
    notPrecededBy: 'not preceded by',
    qStar: 'repeated zero or more times',
    qPlus: 'repeated one or more times',
    qMin: 'repeated {min} or more times',
    qOptional: 'optional (zero or one time)',
    qExact: 'repeated exactly {n} times',
    qRange: 'repeated {min} to {max} times',
    lazy: '{base} (lazy)',
    groupNamed: 'capturing group #{index} (named "{name}")',
    group: 'capturing group #{index}',
    groupNonCapturing: 'a non-capturing group',
    backref: 'a back-reference',
    backrefTo: 'a back-reference to group #{index}',
    option: 'option {n}',
    withColon: '{text}:',
}

/** One line of a plain-language regex explanation. `depth` drives indentation. */
export interface ExplainItem {
    depth: number
    cat: SyntaxCategory // the token's syntax category, for shared coloring
    token: string // the source slice this line describes
    /** Language-neutral description — render with {@link formatExplain} for i18n. */
    desc: ExplainDesc
    /** English rendering of `desc`, for zero-config use. */
    text: string
    /** The token's `[start, end)` offsets in the pattern, when it maps to one. */
    start?: number
    end?: number
}

type Caps = Map<AST.CapturingGroup, number>

/**
 * Explain a regular expression token by token, in plain language.
 * Returns `null` if the pattern (or flags) fail to parse.
 */
export function explainRegex(source: string, flags = ''): ExplainItem[] | null {
    const r = parseRegex(source, flags)
    if (!r.ok) {
        return null
    }
    const caps = indexCapturingGroups(r.ast)
    const items: ExplainItem[] = []
    explainAlternatives(r.ast.alternatives, 0, items, caps, source)
    return items
}

/**
 * Render a description to a string using a message table. Pass a partial
 * `messages` to localize — omitted keys fall back to English. This is the one
 * function a library consumer needs for i18n: give it your translated table.
 */
export function formatExplain(desc: ExplainDesc, messages?: Partial<ExplainMessages>): string {
    const m: ExplainMessages = messages ? { ...EXPLAIN_EN, ...messages } : EXPLAIN_EN
    return render(desc, m)
}

function slice(src: string, node: { start: number, end: number }): string {
    return src.slice(node.start, node.end)
}

/** Push an item, deriving its English `text` from `desc` so they stay in sync. */
function push(items: ExplainItem[], item: Omit<ExplainItem, 'text'>): void {
    items.push({ ...item, text: formatExplain(item.desc) })
}

function explainAlternatives(alts: AST.Alternative[], depth: number, items: ExplainItem[], caps: Caps, src: string): void {
    if (alts.length === 1) {
        explainSequence(alts[0]!.elements, depth, items, caps, src)
        return
    }
    alts.forEach((alt, i) => {
        push(items, { depth, cat: 'alternation', token: i === 0 ? '' : '|', desc: { kind: 'option', n: i + 1 } })
        explainSequence(alt.elements, depth + 1, items, caps, src)
    })
}

function explainSequence(elements: readonly AST.Element[], depth: number, items: ExplainItem[], caps: Caps, src: string): void {
    let run: AST.Character[] = []
    const flush = (): void => {
        if (run.length === 0) {
            return
        }
        const str = run.map(cooked).join('')
        const desc: ExplainDesc = run.length === 1
            ? (str === ' ' ? { kind: 'space' } : { kind: 'char', value: str })
            : { kind: 'text', value: str }
        const start = run[0]!.start
        const end = run.at(-1)!.end
        push(items, { depth, cat: 'literal', token: src.slice(start, end), desc, start, end })
        run = []
    }
    for (const el of elements) {
        if (el.type === 'Character') {
            run.push(el)
            continue
        }
        flush()
        explainElement(el, depth, items, caps, src)
    }
    flush()
}

function explainElement(el: AST.Element, depth: number, items: ExplainItem[], caps: Caps, src: string): void {
    const token = slice(src, el)
    const { start, end } = el
    switch (el.type) {
        case 'Character':
            push(items, { depth, cat: 'literal', token, desc: { kind: 'char', value: cooked(el) }, start, end })
            break
        case 'CharacterSet':
            push(items, { depth, cat: 'charset', token, desc: { kind: 'charset', ...charSetDesc(el) }, start, end })
            break
        case 'CharacterClass':
            push(items, { depth, cat: 'class', token, desc: { kind: 'class', negate: el.negate, members: el.elements.map(classMemberDesc) }, start, end })
            break
        case 'ExpressionCharacterClass':
            push(items, { depth, cat: 'class', token, desc: { kind: 'classExpr' }, start, end })
            break
        case 'Assertion':
            explainAssertion(el, depth, token, items, caps, src)
            break
        case 'Quantifier':
            push(items, { depth, cat: 'quantifier', token, desc: { kind: 'quantifier', min: el.min, max: el.max, greedy: el.greedy }, start, end })
            explainElement(el.element, depth + 1, items, caps, src)
            break
        case 'CapturingGroup':
            push(items, { depth, cat: 'group', token, desc: { kind: 'group', capturing: true, index: caps.get(el), name: el.name ?? undefined }, start, end })
            explainAlternatives(el.alternatives, depth + 1, items, caps, src)
            break
        case 'Group':
            push(items, { depth, cat: 'group', token, desc: { kind: 'group', capturing: false }, start, end })
            explainAlternatives(el.alternatives, depth + 1, items, caps, src)
            break
        case 'Backreference': {
            const target = Array.isArray(el.resolved) ? el.resolved[0] : el.resolved
            push(items, { depth, cat: 'backref', token, desc: { kind: 'backref', index: target ? caps.get(target) : undefined }, start, end })
            break
        }
    }
}

function explainAssertion(el: AST.Assertion, depth: number, token: string, items: ExplainItem[], caps: Caps, src: string): void {
    const { start, end } = el
    switch (el.kind) {
        case 'start':
            push(items, { depth, cat: 'anchor', token, desc: { kind: 'anchor', at: 'start' }, start, end })
            break
        case 'end':
            push(items, { depth, cat: 'anchor', token, desc: { kind: 'anchor', at: 'end' }, start, end })
            break
        case 'word':
            push(items, { depth, cat: 'anchor', token, desc: { kind: 'anchor', at: 'word', negate: el.negate }, start, end })
            break
        case 'lookahead':
            push(items, { depth, cat: 'lookaround', token, desc: { kind: 'lookaround', dir: 'ahead', negate: el.negate }, start, end })
            explainAlternatives(el.alternatives, depth + 1, items, caps, src)
            break
        case 'lookbehind':
            push(items, { depth, cat: 'lookaround', token, desc: { kind: 'lookaround', dir: 'behind', negate: el.negate }, start, end })
            explainAlternatives(el.alternatives, depth + 1, items, caps, src)
            break
    }
}

function cooked(el: AST.Character): string {
    if (el.value < 0x20) {
        return el.raw // control char — keep the escape (e.g. \n)
    }
    return String.fromCodePoint(el.value)
}

function charSetDesc(el: AST.CharacterSet): CharSetDesc {
    switch (el.kind) {
        case 'any':
            return { set: 'any' }
        case 'digit':
            return { set: 'digit', negate: el.negate }
        case 'word':
            return { set: 'word', negate: el.negate }
        case 'space':
            return { set: 'space', negate: el.negate }
        case 'property':
            return { set: 'property', raw: el.raw }
    }
}

function classMemberDesc(e: AST.CharacterClass['elements'][number]): ClassMember {
    switch (e.type) {
        case 'Character':
            return { type: 'char', value: cooked(e) }
        case 'CharacterClassRange':
            return { type: 'range', min: cooked(e.min), max: cooked(e.max) }
        case 'CharacterSet':
            return { type: 'set', set: charSetDesc(e) }
        default:
            return { type: 'char', value: (e as { raw?: string }).raw ?? '?' }
    }
}

// --- Rendering: ExplainDesc + message table → string -----------------------

const PLACEHOLDER = /\{(\w+)\}/g

function interpolate(tpl: string, vars: Record<string, string | number>): string {
    return tpl.replace(PLACEHOLDER, (_, k) => String(vars[k] ?? ''))
}

function render(d: ExplainDesc, m: ExplainMessages): string {
    switch (d.kind) {
        case 'char':
            return interpolate(m.char, { value: d.value })
        case 'space':
            return m.space
        case 'text':
            return interpolate(m.text, { value: d.value })
        case 'charset':
            return charSetText(d, m)
        case 'class':
            return classText(d, m)
        case 'classExpr':
            return m.classExpr
        case 'anchor':
            return d.at === 'start'
                ? m.anchorStart
                : d.at === 'end'
                    ? m.anchorEnd
                    : d.negate ? m.notWordBoundary : m.wordBoundary
        case 'lookaround': {
            const base = d.dir === 'ahead'
                ? (d.negate ? m.notFollowedBy : m.followedBy)
                : (d.negate ? m.notPrecededBy : m.precededBy)
            return interpolate(m.withColon, { text: base })
        }
        case 'quantifier':
            return interpolate(m.withColon, { text: quantifierText(d, m) })
        case 'group': {
            const base = d.capturing
                ? (d.name ? interpolate(m.groupNamed, { index: d.index ?? '', name: d.name }) : interpolate(m.group, { index: d.index ?? '' }))
                : m.groupNonCapturing
            return interpolate(m.withColon, { text: base })
        }
        case 'backref':
            return d.index != null ? interpolate(m.backrefTo, { index: d.index }) : m.backref
        case 'option':
            return interpolate(m.withColon, { text: interpolate(m.option, { n: d.n }) })
    }
}

function charSetText(d: CharSetDesc, m: ExplainMessages): string {
    switch (d.set) {
        case 'any':
            return m.csAny
        case 'digit':
            return d.negate ? m.csDigitNeg : m.csDigit
        case 'word':
            return d.negate ? m.csWordNeg : m.csWord
        case 'space':
            return d.negate ? m.csSpaceNeg : m.csSpace
        case 'property':
            return interpolate(m.csProperty, { raw: d.raw })
    }
}

function classText(d: { negate: boolean, members: ClassMember[] }, m: ExplainMessages): string {
    if (d.members.length === 0) {
        return d.negate ? m.classEmptyNeg : m.classEmpty
    }
    const parts = d.members.map(member => memberText(member, m)).join(m.listSep)
    return interpolate(d.negate ? m.classExcept : m.classOneOf, { parts })
}

function memberText(member: ClassMember, m: ExplainMessages): string {
    switch (member.type) {
        case 'char':
            return member.value
        case 'range':
            return `${member.min}-${member.max}`
        case 'set':
            return charSetText(member.set, m)
    }
}

function quantifierText(d: { min: number, max: number, greedy: boolean }, m: ExplainMessages): string {
    const { min, max, greedy } = d
    let base: string
    if (max === Number.POSITIVE_INFINITY) {
        base = min === 0 ? m.qStar : min === 1 ? m.qPlus : interpolate(m.qMin, { min })
    } else if (min === 0 && max === 1) {
        base = m.qOptional
    } else if (min === max) {
        base = interpolate(m.qExact, { n: min })
    } else {
        base = interpolate(m.qRange, { min, max })
    }
    return greedy ? base : interpolate(m.lazy, { base })
}
