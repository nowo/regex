import { describe, expect, it } from 'vitest'
import { lintRegex } from '../src/parse'

describe('lintRegex', () => {
    it('flags an end assertion followed by a consuming token', () => {
        const w = lintRegex('x$\\d')
        expect(w).toHaveLength(1)
        expect(w[0]).toMatchObject({ rule: 'assertionNeverMatches', start: 1, end: 2 })
    })

    it('flags a start assertion preceded by a consuming token', () => {
        const w = lintRegex('a^')
        expect(w.map(x => x.rule)).toEqual(['assertionNeverMatches'])
    })

    it('flags a word boundary between two word characters', () => {
        const w = lintRegex('\\d\\bx')
        expect(w.map(x => x.rule)).toEqual(['assertionNeverMatches'])
    })

    it('flags an empty character class', () => {
        const w = lintRegex('a[]b')
        expect(w[0]).toMatchObject({ rule: 'emptyCharClass', start: 1, end: 3 })
    })

    it('does not flag well-formed assertions', () => {
        expect(lintRegex('^abc$')).toEqual([])
        expect(lintRegex('(\\d{3})-(\\d{4})')).toEqual([])
        expect(lintRegex('\\bword\\b')).toEqual([])
    })

    it('returns nothing for an unparseable pattern', () => {
        expect(lintRegex('(a')).toEqual([])
    })
})
