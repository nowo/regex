import type { AST } from '@eslint-community/regexpp'
import type { RegexIssue } from './lint'
import { RegExpParser, RegExpSyntaxError } from '@eslint-community/regexpp'
import { lintPattern } from './lint'

export type { RegexIssue } from './lint'

/**
 * Successful parse: the regexpp AST plus any semantic issues found (valid syntax,
 * broken meaning — e.g. `$\d`). `issues` is empty for a clean regex.
 */
export interface ParseSuccess {
    ok: true
    ast: AST.Pattern
    issues: RegexIssue[]
}

/** Failed parse: the (single) syntax error, in the same `issues` shape. */
export interface ParseFailure {
    ok: false
    ast: null
    issues: RegexIssue[]
}

export type ParseResult = ParseSuccess | ParseFailure

// A single parser instance is reused across calls; it is stateless between parses.
const parser = new RegExpParser()

/**
 * Parse a regular expression source + flags into a regexpp AST, then lint it for
 * semantic problems. Flags are validated first, then the pattern. On success the
 * result carries the AST and any {@link RegexIssue}s; callers that only render
 * structure (explanation, coloring) can ignore `issues`, while the diagram and
 * exports treat a non-empty `issues` as "don't render — the regex is broken".
 */
export function parseRegex(source: string, flags = ''): ParseResult {
    // Validate flags up front so e.g. "gg" or "x" surfaces a clear error.
    try {
        parser.parseFlags(flags)
    } catch (err) {
        return fail(err, 'flags')
    }

    const unicode = flags.includes('u')
    const unicodeSets = flags.includes('v')

    // regexpp's parseFlags accepts "uv", but the combination is illegal — and it's
    // a flags problem, not a pattern one, so reject it here.
    if (unicode && unicodeSets) {
        return { ok: false, ast: null, issues: [{ message: 'The \'u\' and \'v\' flags cannot be used together.' }] }
    }

    try {
        const ast = parser.parsePattern(source, 0, source.length, { unicode, unicodeSets })
        return { ok: true, ast, issues: lintPattern(ast, flags) }
    } catch (err) {
        return fail(err, 'pattern')
    }
}

/** Semantic issues only — `[]` when the pattern doesn't parse. */
export function lintRegex(source: string, flags = ''): RegexIssue[] {
    const r = parseRegex(source, flags)
    return r.ok ? r.issues : []
}

function fail(err: unknown, where: 'pattern' | 'flags'): ParseFailure {
    if (err instanceof RegExpSyntaxError) {
        // Pattern errors carry an offset to mark inline; flag errors don't point into the pattern.
        const at = where === 'pattern' ? { start: err.index, end: err.index + 1 } : {}
        return { ok: false, ast: null, issues: [{ message: err.message, ...at }] }
    }
    // Non-syntax error (should not normally happen) — surface it without a position.
    return { ok: false, ast: null, issues: [{ message: err instanceof Error ? err.message : String(err) }] }
}
