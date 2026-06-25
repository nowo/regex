import type { AST } from '@eslint-community/regexpp'
import type { ReadonlyFlags } from 'regexp-ast-analysis'
import { visitRegExpAST } from '@eslint-community/regexpp'
import { Chars, getFirstCharAfter, getMatchingDirectionFromAssertionKind } from 'regexp-ast-analysis'

/**
 * A quality issue in an otherwise valid pattern. `rule` lets the UI localize the
 * message; `start`/`end` are the offending token's offsets in the pattern source.
 * Surfaced through {@link parseRegex} alongside syntax errors.
 */
export interface RegexIssue {
    /** Stable id for localization; absent for raw parser (syntax) errors. */
    rule?: 'assertionNeverMatches' | 'emptyCharClass'
    /** Human-readable fallback (the parser's text for syntax errors). */
    message: string
    /** Pattern offsets of the offending token; absent for flag errors. */
    start?: number
    end?: number
}

function toFlags(flags: string): ReadonlyFlags {
    return {
        global: flags.includes('g'),
        ignoreCase: flags.includes('i'),
        multiline: flags.includes('m'),
        dotAll: flags.includes('s'),
        unicode: flags.includes('u'),
        sticky: flags.includes('y'),
        hasIndices: flags.includes('d'),
        unicodeSets: flags.includes('v'),
    }
}

/**
 * Find semantic issues in a parsed pattern — chiefly assertions that can never be
 * satisfied (`$\d`, `a^`, a `\b` between two word chars) and empty character
 * classes. Operates on an already-parsed AST so it can run inside the parser.
 */
export function lintPattern(ast: AST.Pattern, flags: string): RegexIssue[] {
    const f = toFlags(flags)
    const out: RegexIssue[] = []

    visitRegExpAST(ast, {
        onAssertionEnter(a) {
            if (assertionNeverMatches(a, f)) {
                out.push({
                    rule: 'assertionNeverMatches',
                    message: 'This assertion can never be satisfied; the regex will never match.',
                    start: a.start,
                    end: a.end,
                })
            }
        },
        onCharacterClassEnter(cc) {
            // `[]` (non-negated) matches nothing. (`[]` is a syntax error under the
            // u/v flags, so it never reaches here in that case.)
            if (!cc.negate && cc.elements.length === 0) {
                out.push({
                    rule: 'emptyCharClass',
                    message: 'Empty character class [] matches nothing.',
                    start: cc.start,
                    end: cc.end,
                })
            }
        },
    })
    return out
}

/** True when an assertion is positioned so it can never hold (the path is dead). */
function assertionNeverMatches(a: AST.Assertion, flags: ReadonlyFlags): boolean {
    if (a.kind === 'start' || a.kind === 'end') {
        // The edge (^/$) needs a string boundary where it sits; if a character is
        // forced there instead (e.g. `$\d`, `a^`), the edge can never be the boundary.
        const dir = getMatchingDirectionFromAssertionKind(a.kind)
        return !getFirstCharAfter(a, dir, flags).edge
    }
    if (a.kind === 'word') {
        // \b needs (word | edge) on one side and the opposite on the other; \B needs
        // the same on both. Flag only when the surrounding chars make that impossible.
        const word = Chars.word(flags)
        const before = getFirstCharAfter(a, 'rtl', flags)
        const after = getFirstCharAfter(a, 'ltr', flags)
        // "definitely a word char" vs "definitely a non-word position" (edge counts as non-word).
        const beforeWord = !before.edge && before.char.isSubsetOf(word)
        const beforeNon = before.char.isDisjointWith(word)
        const afterWord = !after.edge && after.char.isSubsetOf(word)
        const afterNon = after.char.isDisjointWith(word)
        const alwaysBoundary = (beforeWord && afterNon) || (beforeNon && afterWord)
        const neverBoundary = (beforeWord && afterWord) || (beforeNon && afterNon)
        return a.negate ? alwaysBoundary : neverBoundary
    }
    // Lookarounds are left alone (their reachability needs deeper analysis).
    return false
}
