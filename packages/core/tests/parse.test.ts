import type { AST } from '@eslint-community/regexpp'
import type { ParseSuccess } from '../src/parse'
import { describe, expect, it } from 'vitest'
import { parseRegex } from '../src/parse'

/** Parse and assert success, returning the Pattern AST. */
function parseOk(source: string, flags = ''): AST.Pattern {
    const r = parseRegex(source, flags)
    if (!r.ok) {
        throw new Error(`expected ok parse for /${source}/${flags}, got error: ${r.message}`)
    }
    return (r as ParseSuccess).ast
}

/** Elements of the first alternative — the common case for single-branch patterns. */
function elements(source: string, flags = ''): AST.Element[] {
    return parseOk(source, flags).alternatives[0]!.elements
}

describe('parseRegex — node coverage', () => {
    it('returns a Pattern root', () => {
        const ast = parseOk('a')
        expect(ast.type).toBe('Pattern')
        expect(ast.alternatives).toHaveLength(1)
    })

    it('character literal', () => {
        const [el] = elements('a')
        expect(el!.type).toBe('Character')
    })

    it('characterSet — digit, any, unicode property', () => {
        expect((elements('\\d')[0] as AST.CharacterSet).kind).toBe('digit')
        expect((elements('.')[0] as AST.CharacterSet).kind).toBe('any')
        // Unicode property escape needs the u flag
        expect((elements('\\p{L}', 'u')[0] as AST.CharacterSet).kind).toBe('property')
    })

    it('characterClass — range and negated range', () => {
        const cls = elements('[a-z]')[0] as AST.CharacterClass
        expect(cls.type).toBe('CharacterClass')
        expect(cls.negate).toBe(false)
        expect((elements('[^a-z]')[0] as AST.CharacterClass).negate).toBe(true)
    })

    it('alternative (sequence) — abc is one alternative of three elements', () => {
        const ast = parseOk('abc')
        expect(ast.alternatives).toHaveLength(1)
        expect(ast.alternatives[0]!.elements).toHaveLength(3)
    })

    it('choice — a|b|c is three alternatives', () => {
        const ast = parseOk('a|b|c')
        expect(ast.alternatives).toHaveLength(3)
    })

    it('quantifier — greedy star, lazy plus, and bounded range', () => {
        const star = elements('a*')[0] as AST.Quantifier
        expect(star.type).toBe('Quantifier')
        expect(star.min).toBe(0)
        expect(star.max).toBe(Number.POSITIVE_INFINITY)
        expect(star.greedy).toBe(true)

        const lazy = elements('a+?')[0] as AST.Quantifier
        expect(lazy.min).toBe(1)
        expect(lazy.greedy).toBe(false)

        const range = elements('a{2,3}')[0] as AST.Quantifier
        expect([range.min, range.max]).toEqual([2, 3])
    })

    it('group — non-capturing', () => {
        const g = elements('(?:ab)')[0] as AST.Group
        expect(g.type).toBe('Group')
    })

    it('capturingGroup — anonymous and named', () => {
        const cap = elements('(a)')[0] as AST.CapturingGroup
        expect(cap.type).toBe('CapturingGroup')
        expect(cap.name).toBeNull()

        const named = elements('(?<year>\\d)')[0] as AST.CapturingGroup
        expect(named.name).toBe('year')
    })

    it('assertion — start, end, word-boundary anchors', () => {
        expect((elements('^')[0] as AST.Assertion).kind).toBe('start')
        expect((elements('$')[0] as AST.Assertion).kind).toBe('end')
        expect((elements('\\b')[0] as AST.Assertion).kind).toBe('word')
    })

    it('assertion — lookahead and lookbehind', () => {
        const ahead = elements('(?=a)')[0] as AST.Assertion
        expect(ahead.kind).toBe('lookahead')
        const behind = elements('(?<=a)')[0] as AST.Assertion
        expect(behind.kind).toBe('lookbehind')
    })

    it('backreference — numeric and named', () => {
        const numeric = elements('(a)\\1')[1] as AST.Backreference
        expect(numeric.type).toBe('Backreference')

        const named = elements('(?<n>a)\\k<n>')[1] as AST.Backreference
        expect(named.type).toBe('Backreference')
        expect((named.resolved as AST.CapturingGroup).name).toBe('n')
    })

    it('v flag — character class set operations', () => {
        // subtraction is only valid under the v flag; regexpp models set-operation
        // classes as a distinct node type (ExpressionCharacterClass).
        const cls = elements('[\\p{L}--[a]]', 'v')[0] as AST.ExpressionCharacterClass
        expect(cls.type).toBe('ExpressionCharacterClass')
    })
})

describe('parseRegex — error handling', () => {
    it('unbalanced group → pattern error with index', () => {
        const r = parseRegex('(a')
        expect(r.ok).toBe(false)
        if (!r.ok) {
            expect(r.where).toBe('pattern')
            expect(r.message).toBeTruthy()
            expect(typeof r.index).toBe('number')
        }
    })

    it('unterminated character class → pattern error', () => {
        const r = parseRegex('[a-z')
        expect(r.ok).toBe(false)
        if (!r.ok) {
            expect(r.where).toBe('pattern')
        }
    })

    it('nothing to repeat → pattern error', () => {
        const r = parseRegex('*abc')
        expect(r.ok).toBe(false)
        if (!r.ok) {
            expect(r.where).toBe('pattern')
        }
    })

    it('duplicate flag → flags error', () => {
        const r = parseRegex('a', 'gg')
        expect(r.ok).toBe(false)
        if (!r.ok) {
            expect(r.where).toBe('flags')
        }
    })

    it('unknown flag → flags error', () => {
        const r = parseRegex('a', 'x')
        expect(r.ok).toBe(false)
        if (!r.ok) {
            expect(r.where).toBe('flags')
        }
    })

    it('illegal u+v combination → flags error', () => {
        const r = parseRegex('a', 'uv')
        expect(r.ok).toBe(false)
        if (!r.ok) {
            expect(r.where).toBe('flags')
        }
    })

    it('empty pattern is valid', () => {
        expect(parseRegex('').ok).toBe(true)
    })
})
