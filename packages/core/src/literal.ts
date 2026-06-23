const ALREADY_LITERAL = /^\/.*\/[dgimsuvy]*$/s

/**
 * Build a valid regular-expression literal string `/source/flags`.
 *
 * The source is escaped so the result is a well-formed literal that round-trips:
 *  - unescaped forward slashes become `\/` (so `/` → `/\//`, not the invalid `///`)
 *  - an empty source becomes `(?:)` (so `''` → `/(?:)/`, not the invalid `//`)
 *  - already-escaped sequences (e.g. `\/`, `\d`) are left untouched
 *
 * If called with a single argument that is *already* a `/.../flags` literal, it
 * is returned unchanged — so passing a literal back through is a no-op.
 */
export function toRegexLiteral(source: string, flags?: string): string {
    if (flags === undefined && ALREADY_LITERAL.test(source)) {
        return source
    }
    return `/${escapeSource(source)}/${flags ?? ''}`
}

function escapeSource(source: string): string {
    if (source === '') {
        return '(?:)'
    }
    let out = ''
    for (let i = 0; i < source.length; i++) {
        const ch = source[i]!
        if (ch === '\\') {
            // Keep the escape sequence intact (don't re-escape the next char).
            out += ch + (source[i + 1] ?? '')
            i++
            continue
        }
        out += ch === '/' ? '\\/' : ch
    }
    return out
}
