import type { AST } from '@eslint-community/regexpp'
import { RegExpParser, RegExpSyntaxError } from '@eslint-community/regexpp'

/** Successful parse: the regexpp AST root (`Pattern`). */
export interface ParseSuccess {
    ok: true
    ast: AST.Pattern
}

/** Failed parse: a human-readable message plus the offending index for UI highlighting. */
export interface ParseFailure {
    ok: false
    message: string
    /** Character offset of the error. Refers to `source` for pattern errors, to `flags` for flag errors. */
    index: number
    /** Which input the `index` points into. */
    where: 'pattern' | 'flags'
}

export type ParseResult = ParseSuccess | ParseFailure

// A single parser instance is reused across calls; it is stateless between parses.
const parser = new RegExpParser()

/**
 * Parse a regular expression source + flags into a regexpp AST.
 *
 * Flags are validated first (unknown/duplicate flags, the illegal `u`+`v` combo),
 * then the pattern is parsed in the mode selected by the `u` / `v` flags.
 */
export function parseRegex(source: string, flags = ''): ParseResult {
    // Validate flags up front so e.g. "gg" or "x" surfaces a clear error.
    try {
        parser.parseFlags(flags)
    } catch (err) {
        return toFailure(err, 'flags')
    }

    const unicode = flags.includes('u')
    const unicodeSets = flags.includes('v')

    // regexpp's parseFlags accepts "uv", but the combination is illegal — and it's
    // a flags problem, not a pattern one, so reject it here with a flags-scoped error.
    if (unicode && unicodeSets) {
        return {
            ok: false,
            message: 'The \'u\' and \'v\' flags cannot be used together.',
            index: Math.max(flags.indexOf('u'), flags.indexOf('v')),
            where: 'flags',
        }
    }

    try {
        const ast = parser.parsePattern(source, 0, source.length, { unicode, unicodeSets })
        return { ok: true, ast }
    } catch (err) {
        return toFailure(err, 'pattern')
    }
}

function toFailure(err: unknown, where: 'pattern' | 'flags'): ParseFailure {
    if (err instanceof RegExpSyntaxError) {
        return { ok: false, message: err.message, index: err.index, where }
    }
    // Non-syntax error (should not normally happen) — surface it without a position.
    return { ok: false, message: err instanceof Error ? err.message : String(err), index: 0, where }
}
