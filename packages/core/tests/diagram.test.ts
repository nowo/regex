import { describe, expect, it } from 'vitest'
import { regexToSvg, renderToSvg } from '../src/index'
import { buildDiagram } from '../src/layout/measure'
import { parseRegex } from '../src/parse'

function diagram(source: string, flags = '') {
    const r = parseRegex(source, flags)
    if (!r.ok) {
        throw new Error(`parse failed: ${r.message}`)
    }
    return buildDiagram(r.ast)
}

describe('buildDiagram', () => {
    it('produces positive dimensions and a root rail line', () => {
        const d = diagram('a')
        expect(d.width).toBeGreaterThan(0)
        expect(d.height).toBeGreaterThan(0)
        expect(d.railY).toBeGreaterThan(0)
        expect(d.caps).toHaveLength(2)
    })

    it('a sequence widens; a choice grows taller', () => {
        const seq = diagram('abc')
        const single = diagram('a')
        expect(seq.width).toBeGreaterThan(single.width)

        const choice = diagram('a|b|c')
        expect(choice.height).toBeGreaterThan(single.height)
        // three branches → three placed children in the root choice node
        expect(choice.root.kind).toBe('choice')
        expect(choice.root.children).toHaveLength(3)
    })

    it('a quantifier wraps its body in a repeat node with a readable label', () => {
        const d = diagram('a+')
        expect(d.root.kind).toBe('repeat')
        expect(d.root.texts?.[0]?.content).toBe('1 or more times')
        expect(diagram('a*?').root.texts?.[0]?.content).toBe('0 or more times (lazy)')
        expect(diagram('a?').root.texts?.[0]?.content).toBe('optional')
        expect(diagram('a{2,5}').root.texts?.[0]?.content).toBe('2 to 5 times')
    })

    it('a character class expands into stacked items', () => {
        const d = diagram('[0-9a-z_]')
        expect(d.root.kind).toBe('charclass')
        expect(d.root.items?.map(i => i.label)).toEqual(['0-9', 'a-z', '_'])
        expect(d.root.texts?.[0]?.content).toBe('One of:')
    })

    it('a negated character class is marked "None of:"', () => {
        const d = diagram('[^<>]')
        expect(d.root.kind).toBe('charclass')
        expect(d.root.negate).toBe(true)
        expect(d.root.texts?.[0]?.content).toBe('None of:')
    })

    it('a capturing group carries its index label', () => {
        const d = diagram('(a)(b)')
        // root is a sequence of two capturing groups
        const groups = d.root.children.map(c => c.node).filter(n => n.kind === 'group')
        expect(groups).toHaveLength(2)
        expect(groups[0]?.texts?.[0]?.content).toBe('Group #1')
        expect(groups[1]?.texts?.[0]?.content).toBe('Group #2')
    })

    it('the MVP target patterns lay out without throwing', () => {
        for (const [src, flags] of [['^(\\d{3})-(\\d{4})$', ''], ['a|b|c', ''], ['[a-z]+\\.[a-z]+', '']] as const) {
            const d = diagram(src, flags)
            expect(d.width).toBeGreaterThan(0)
        }
    })
})

describe('character class — v-flag set operations', () => {
    it('subtraction expands its operands', () => {
        const d = diagram('[\\p{L}--[aeiou]]', 'v')
        expect(d.root.kind).toBe('charclass')
        expect(d.root.texts?.[0]?.content).toBe('Subtract (A − B):')
        // \p{L} is a leaf; [aeiou] becomes a nested set child
        expect(d.root.items?.some(i => i.label === '\\p{L}')).toBe(true)
        expect(d.root.children).toHaveLength(1)
        expect(d.root.children[0]?.node.texts?.[0]?.content).toBe('One of:')
    })

    it('intersection lists operands under "All of:"', () => {
        const d = diagram('[\\w&&\\d]', 'v')
        expect(d.root.texts?.[0]?.content).toBe('All of:')
        expect(d.root.items?.map(i => i.label)).toEqual(['Word', 'Digit'])
    })

    it('string disjunction \\q{} expands to its strings', () => {
        const d = diagram('[\\q{ab|cd}]', 'v')
        const child = d.root.children[0]?.node
        expect(child?.items?.map(i => i.label)).toEqual(['ab', 'cd'])
    })

    it('a nested class becomes a nested set', () => {
        const d = diagram('[a[b-d]]', 'v')
        expect(d.root.kind).toBe('charclass')
        expect(d.root.children).toHaveLength(1)
    })
})

describe('back-reference links', () => {
    it('a numeric backreference links to its group', () => {
        const d = diagram('(a)\\1')
        expect(d.links).toHaveLength(1)
    })

    it('a named backreference links to its group', () => {
        const d = diagram('(?<x>a)\\k<x>')
        expect(d.links).toHaveLength(1)
    })

    it('no links without a backreference', () => {
        expect(diagram('(a)b').links).toHaveLength(0)
    })
})

describe('renderToSvg / regexToSvg', () => {
    it('renders a self-contained svg element', () => {
        const svg = renderToSvg(diagram('a|b'))
        expect(svg.startsWith('<svg')).toBe(true)
        expect(svg).toContain('viewBox')
        expect(svg).toContain('</svg>')
        expect(svg).toContain('rr-rail')
    })

    it('escapes special characters in labels', () => {
        const svg = regexToSvg('<&>')!
        expect(svg).toContain('&lt;')
        expect(svg).toContain('&amp;')
        expect(svg).not.toContain('<&>')
    })

    it('regexToSvg returns null on parse failure', () => {
        expect(regexToSvg('(a')).toBeNull()
        expect(regexToSvg('a', 'zz')).toBeNull()
    })

    it('draws a token-colored source band linked to the diagram', () => {
        const svg = renderToSvg(diagram('a[0-9]'))
        // one source-band char group per source character, carrying its index
        expect(svg.match(/class="rr-src-char/g) ?? []).toHaveLength(6)
        expect(svg).toContain('data-i="0"')
        // the literal `a` is colored as a literal, the class `[0-9]` as a class
        expect(svg).toContain('rr-src-char rr-src-literal')
        expect(svg).toContain('rr-src-char rr-src-class')
        // the `0-9` item char maps to the item range (narrower than the whole class)
        expect(svg).toContain('data-i="2" data-start="2" data-end="5"')
    })
})
