import { toRegexLiteral } from '@wzo/regex-diagram'

const NAMED_GROUP = /^\(\?<([a-z_$][\w$]*)>/i
const STRIP_G = /g/g

export interface MatchGroup {
    index: number // 0 = whole match, 1.. = capture groups
    name?: string
    value: string | undefined
    start?: number
    end?: number
}

export interface HighlightRange { start: number, end: number, type: 'match' | 'group' }
export interface Segment { text: string, cls: string }

/** The JS regex methods offered as tabs. */
export type MethodName = 'test' | 'exec' | 'match' | 'matchAll' | 'search' | 'split' | 'replace'
export const METHODS: MethodName[] = ['test', 'exec', 'match', 'matchAll', 'search', 'split', 'replace']

/** Result of running one method against one input line. */
export interface LineRun {
    line: string
    ok?: boolean // matched / found (undefined for split & replace)
    full: boolean // the match spans the whole line
    result: string // the method's return value, stringified
    match?: { start: number, end: number }
    groups: MatchGroup[]
}

export interface MethodRun {
    code: string // copy-pasteable signature, e.g. `/…/g.test(str)`
    lines: LineRun[]
}

function withFlags(flags: string, add: string): string {
    let f = flags
    for (const c of add) {
        if (!f.includes(c)) {
            f += c
        }
    }
    return f
}

/** Capture-group names by group number (index 0 unused). Scans the source directly. */
export function captureNames(pattern: string): (string | undefined)[] {
    const names: (string | undefined)[] = [undefined]
    let inClass = false
    for (let i = 0; i < pattern.length; i++) {
        const c = pattern[i]
        if (c === '\\') {
            i++
            continue
        }
        if (inClass) {
            if (c === ']') {
                inClass = false
            }
            continue
        }
        if (c === '[') {
            inClass = true
            continue
        }
        if (c === '(') {
            if (pattern[i + 1] === '?') {
                const named = NAMED_GROUP.exec(pattern.slice(i))
                if (named) {
                    names.push(named[1])
                }
            } else {
                names.push(undefined)
            }
        }
    }
    return names
}

function preview(value: unknown): string {
    let s: string
    try {
        s = JSON.stringify(value)
    } catch {
        s = String(value)
    }
    return s != null && s.length > 160 ? `${s.slice(0, 160)}…` : (s ?? String(value))
}

function signature(method: MethodName, lit: string, litG: string): string {
    switch (method) {
        case 'test': return `${lit}.test(str)`
        case 'exec': return `${lit}.exec(str)`
        case 'match': return `str.match(${lit})`
        case 'matchAll': return `[...str.matchAll(${litG})]`
        case 'search': return `str.search(${lit})`
        case 'split': return `str.split(${lit})`
        case 'replace': return `str.replace(${lit}, repl)`
    }
}

/** Run one JS regex method against every non-empty line of `text`. */
export function runMethod(method: MethodName, pattern: string, flags: string, text: string, replacement: string): MethodRun {
    const base = flags.replace(STRIP_G, '')
    let reFirst: RegExp | null = null
    try {
        reFirst = new RegExp(pattern, withFlags(base, 'd'))
    } catch {
        try {
            reFirst = new RegExp(pattern, base)
        } catch {
            return { code: '', lines: [] }
        }
    }

    const names = captureNames(pattern)
    const lit = toRegexLiteral(pattern, flags)
    const litG = toRegexLiteral(pattern, withFlags(flags, 'g'))
    const code = signature(method, lit, litG)

    const lines: LineRun[] = []
    for (const line of text.split('\n')) {
        if (line === '') {
            continue
        }

        // First match (no `g`, with `d`) — for highlighting and group spans.
        const fm = reFirst.exec(line)
        const groups: MatchGroup[] = []
        let match: { start: number, end: number } | undefined
        let full = false
        if (fm) {
            const indices = (fm as RegExpExecArray & { indices?: ([number, number] | undefined)[] }).indices
            for (let i = 0; i < fm.length; i++) {
                const span = indices?.[i]
                groups.push({ index: i, name: names[i], value: fm[i], start: span?.[0], end: span?.[1] })
            }
            const end = fm.index + fm[0].length
            match = { start: fm.index, end }
            full = fm.index === 0 && end === line.length
        }

        // The method's actual result, using the real flags (so it matches `str.method()`).
        let ok: boolean | undefined
        let result = ''
        try {
            switch (method) {
                case 'test':
                    ok = new RegExp(pattern, flags).test(line)
                    result = String(ok)
                    break
                case 'exec': {
                    const v = new RegExp(pattern, flags).exec(line)
                    ok = v != null
                    result = preview(v)
                    break
                }
                case 'match': {
                    const v = line.match(new RegExp(pattern, flags))
                    ok = v != null
                    result = preview(v)
                    break
                }
                case 'matchAll': {
                    const v = Array.from(line.matchAll(new RegExp(pattern, withFlags(flags, 'g'))), m => m[0])
                    ok = v.length > 0
                    result = preview(v)
                    break
                }
                case 'search': {
                    const v = line.search(new RegExp(pattern, flags))
                    ok = v >= 0
                    result = String(v)
                    break
                }
                case 'split':
                    result = preview(line.split(new RegExp(pattern, flags)))
                    break
                case 'replace':
                    result = line.replace(new RegExp(pattern, flags), replacement)
                    break
            }
        } catch (e) {
            result = `Error: ${(e as Error).message}`
        }

        lines.push({ line, ok, full, result, match, groups })
    }
    return { code, lines }
}

/** A copy-pasteable JS snippet for the selected method, destructuring any groups. */
export function buildJsSnippet(pattern: string, flags: string, method: MethodName = 'test'): string {
    const lit = toRegexLiteral(pattern, flags)
    const litG = toRegexLiteral(pattern, withFlags(flags, 'g'))
    const names = captureNames(pattern)
    const count = names.length - 1
    const vars = ['full', ...Array.from({ length: count }, (_, k) => names[k + 1] ?? `group${k + 1}`)]
    const grab = count > 0 ? `\n  const [${vars.join(', ')}] = match` : ''
    const global = flags.includes('g')

    switch (method) {
        case 'test':
            return `const re = ${lit}\n\nif (re.test(str)) {\n  // matched\n}`
        case 'exec':
            return global
                ? `const re = ${lit}\n\nlet match\nwhile ((match = re.exec(str)) !== null) {${grab}\n}`
                : `const re = ${lit}\n\nconst match = re.exec(str)\nif (match) {${grab}\n}`
        case 'match':
            return global
                ? `const re = ${lit}\n\n// with the g flag, match() returns all matched strings\nconst matches = str.match(re)`
                : `const re = ${lit}\n\nconst match = str.match(re)\nif (match) {${grab}\n}`
        case 'matchAll':
            return `const re = ${litG}\n\nfor (const match of str.matchAll(re)) {${grab}\n}`
        case 'search':
            return `const re = ${lit}\n\nconst index = str.search(re) // -1 if not found`
        case 'split':
            return `const re = ${lit}\n\nconst parts = str.split(re)`
        case 'replace':
            return `const re = ${lit}\n\nconst result = str.replace(re, '${count > 0 ? '$1' : 'replacement'}')`
    }
}

/** Split `text` into styled segments given highlight ranges (group beats match). */
export function buildSegments(text: string, ranges: HighlightRange[]): Segment[] {
    const valid = ranges.filter(r => r.end > r.start)
    if (valid.length === 0) {
        return [{ text, cls: '' }]
    }
    const stops = new Set<number>([0, text.length])
    for (const r of valid) {
        stops.add(Math.max(0, Math.min(text.length, r.start)))
        stops.add(Math.max(0, Math.min(text.length, r.end)))
    }
    const sorted = [...stops].sort((a, b) => a - b)
    const segments: Segment[] = []
    for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i]!
        const b = sorted[i + 1]!
        if (a === b) {
            continue
        }
        let cls = ''
        let priority = 0
        for (const r of valid) {
            if (r.start <= a && r.end >= b) {
                const p = r.type === 'group' ? 2 : 1
                if (p > priority) {
                    priority = p
                    cls = r.type
                }
            }
        }
        segments.push({ text: text.slice(a, b), cls })
    }
    return segments
}
