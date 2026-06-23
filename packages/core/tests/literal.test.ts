import { describe, expect, it } from 'vitest'
import { toRegexLiteral } from '../src/literal'

describe('toRegexLiteral', () => {
    it('wraps source and flags', () => {
        expect(toRegexLiteral('abc', 'gi')).toBe('/abc/gi')
        expect(toRegexLiteral('/abc/gi')).toBe('/abc/gi')
        expect(toRegexLiteral('a', '')).toBe('/a/')
    })

    it('escapes unescaped forward slashes', () => {
        expect(toRegexLiteral('/', '')).toBe('/\\//')
        expect(toRegexLiteral('a/b', 'i')).toBe('/a\\/b/i')
        expect(toRegexLiteral('[/]', '')).toBe('/[\\/]/')
    })

    it('leaves already-escaped slashes alone', () => {
        expect(toRegexLiteral('a\\/b', '')).toBe('/a\\/b/')
    })

    it('does not treat an escaped char as an escape opener', () => {
        // `\\` then `/` → the `/` is unescaped and must be escaped
        expect(toRegexLiteral('\\\\/', '')).toBe('/\\\\\\//')
    })

    it('represents an empty pattern as a non-capturing group', () => {
        expect(toRegexLiteral('', '')).toBe('/(?:)/')
        expect(toRegexLiteral('', 'g')).toBe('/(?:)/g')
    })
})
