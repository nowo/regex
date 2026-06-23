import { describe, expect, it } from 'vitest'
import { explainRegex } from '../src/explain'

describe('explainRegex', () => {
    it('returns null on a parse error', () => {
        expect(explainRegex('(a')).toBeNull()
    })

    it('explains anchors, sets and quantifiers with depth', () => {
        const items = explainRegex('^\\d{4}$')!
        expect(items[0]).toMatchObject({ depth: 0, token: '^' })
        expect(items[0]!.text).toContain('start of the string')
        // the quantifier wraps the digit one level deeper
        const quant = items.find(i => i.token === '\\d{4}')!
        expect(quant.depth).toBe(0)
        expect(quant.text).toContain('exactly 4 times')
        const digit = items.find(i => i.token === '\\d')!
        expect(digit.depth).toBe(1)
        expect(digit.text).toContain('digit')
    })

    it('numbers capturing groups and back-references', () => {
        const items = explainRegex('(?<y>a)(b)\\1')!
        expect(items.find(i => i.token === '(?<y>a)')!.text).toContain('group #1 (named "y")')
        expect(items.find(i => i.token === '(b)')!.text).toContain('group #2')
        expect(items.find(i => i.token === '\\1')!.text).toContain('back-reference to group #1')
    })

    it('lists alternatives as options', () => {
        const items = explainRegex('a|b|c')!
        expect(items.filter(i => i.text.startsWith('option'))).toHaveLength(3)
    })
})
