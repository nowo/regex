/**
 * The syntactic categories that drive the shared regex color palette. One color
 * per category is used everywhere the regex is shown — the source band on the
 * diagram, the diagram's own group/quantifier/lookaround accents, and (in the
 * playground) the syntax reference and the explanation panel — so a token reads
 * the same color in every view.
 *
 * Colors live in CSS as `--rr-syntax-<category>` custom properties (with
 * light-mode fallbacks baked into the rendered SVG); this is only the key set.
 */
export type SyntaxCategory
    = | 'literal' // a plain character: a, b, 1
        | 'charset' // a shorthand set: \d \w \s .
        | 'class' // a bracketed class: [a-z]
        | 'anchor' // ^ $ \b
        | 'quantifier' // * + ? {n,m} and lazy ?
        | 'group' // ( ) (?: (?<name>
        | 'lookaround' // (?= (?! (?<= (?<!
        | 'backref' // \1 \k<name>
        | 'alternation' // |

/** All categories, in a stable order (e.g. for legends). */
export const SYNTAX_CATEGORIES: readonly SyntaxCategory[] = [
    'literal',
    'charset',
    'class',
    'anchor',
    'quantifier',
    'group',
    'lookaround',
    'backref',
    'alternation',
]
