import type { AST } from '@eslint-community/regexpp'
import { indexCapturingGroups } from './layout/build'
import { parseRegex } from './parse'

/** One line of a plain-language regex explanation. `depth` drives indentation. */
export interface ExplainItem {
    depth: number
    token: string // the source slice this line describes
    text: string // plain-language description
}

type Caps = Map<AST.CapturingGroup, number>

const LEADING_ARTICLE = /^an? /

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

function slice(src: string, node: { start: number, end: number }): string {
    return src.slice(node.start, node.end)
}

function quote(s: string): string {
    return `"${s}"`
}

function explainAlternatives(alts: AST.Alternative[], depth: number, items: ExplainItem[], caps: Caps, src: string): void {
    if (alts.length === 1) {
        explainSequence(alts[0]!.elements, depth, items, caps, src)
        return
    }
    alts.forEach((alt, i) => {
        items.push({ depth, token: i === 0 ? '' : '|', text: `option ${i + 1}:` })
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
        const text = run.length === 1
            ? (str === ' ' ? 'a space' : `the character ${quote(str)}`)
            : `the text ${quote(str)}`
        items.push({ depth, token: src.slice(run[0]!.start, run.at(-1)!.end), text })
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
    switch (el.type) {
        case 'Character':
            items.push({ depth, token, text: `the character ${quote(cooked(el))}` })
            break
        case 'CharacterSet':
            items.push({ depth, token, text: charSetText(el) })
            break
        case 'CharacterClass':
            items.push({ depth, token, text: charClassText(el) })
            break
        case 'ExpressionCharacterClass':
            items.push({ depth, token, text: 'a set-operation character class (see the diagram)' })
            break
        case 'Assertion':
            explainAssertion(el, depth, token, items, caps, src)
            break
        case 'Quantifier':
            items.push({ depth, token, text: `${quantifierText(el)}:` })
            explainElement(el.element, depth + 1, items, caps, src)
            break
        case 'CapturingGroup': {
            const i = caps.get(el)
            items.push({ depth, token, text: el.name ? `capturing group #${i} (named ${quote(el.name)}):` : `capturing group #${i}:` })
            explainAlternatives(el.alternatives, depth + 1, items, caps, src)
            break
        }
        case 'Group':
            items.push({ depth, token, text: 'a non-capturing group:' })
            explainAlternatives(el.alternatives, depth + 1, items, caps, src)
            break
        case 'Backreference': {
            const target = Array.isArray(el.resolved) ? el.resolved[0] : el.resolved
            const i = target ? caps.get(target) : undefined
            items.push({ depth, token, text: i != null ? `a back-reference to group #${i}` : 'a back-reference' })
            break
        }
    }
}

function explainAssertion(el: AST.Assertion, depth: number, token: string, items: ExplainItem[], caps: Caps, src: string): void {
    switch (el.kind) {
        case 'start':
            items.push({ depth, token, text: 'the start of the string (or line with the m flag)' })
            break
        case 'end':
            items.push({ depth, token, text: 'the end of the string (or line with the m flag)' })
            break
        case 'word':
            items.push({ depth, token, text: el.negate ? 'a position that is not a word boundary' : 'a word boundary' })
            break
        case 'lookahead':
            items.push({ depth, token, text: el.negate ? 'not followed by:' : 'followed by:' })
            explainAlternatives(el.alternatives, depth + 1, items, caps, src)
            break
        case 'lookbehind':
            items.push({ depth, token, text: el.negate ? 'not preceded by:' : 'preceded by:' })
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

function charSetText(el: AST.CharacterSet): string {
    switch (el.kind) {
        case 'any':
            return 'any character (except line breaks)'
        case 'digit':
            return el.negate ? 'any non-digit' : 'a digit (0-9)'
        case 'word':
            return el.negate ? 'a non-word character' : 'a word character (letter, digit, or underscore)'
        case 'space':
            return el.negate ? 'a non-whitespace character' : 'a whitespace character'
        case 'property':
            return `a character with Unicode property ${el.raw}`
    }
}

function charClassText(el: AST.CharacterClass): string {
    if (el.elements.length === 0) {
        return el.negate ? 'any character' : 'nothing'
    }
    const parts = el.elements.map(classMemberText)
    return `${el.negate ? 'any character except' : 'one of'}: ${parts.join(', ')}`
}

function classMemberText(e: AST.CharacterClass['elements'][number]): string {
    switch (e.type) {
        case 'Character':
            return cooked(e)
        case 'CharacterClassRange':
            return `${cooked(e.min)}-${cooked(e.max)}`
        case 'CharacterSet':
            return charSetText(e).replace(LEADING_ARTICLE, '')
        default:
            return (e as { raw?: string }).raw ?? '?'
    }
}

function quantifierText(el: AST.Quantifier): string {
    const { min, max, greedy } = el
    let text: string
    if (max === Number.POSITIVE_INFINITY) {
        text = min === 0 ? 'repeated zero or more times' : min === 1 ? 'repeated one or more times' : `repeated ${min} or more times`
    } else if (min === 0 && max === 1) {
        text = 'optional (zero or one time)'
    } else if (min === max) {
        text = `repeated exactly ${min} times`
    } else {
        text = `repeated ${min} to ${max} times`
    }
    return greedy ? text : `${text} (lazy)`
}
