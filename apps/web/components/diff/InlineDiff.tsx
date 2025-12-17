"use client"

import { cn } from "@/lib/utils"

type DiffLine = {
    type: 'add' | 'remove' | 'context'
    lineNumber: number
    content: string
    oldLineNumber?: number
    newLineNumber?: number
}

type InlineDiffProps = {
    originalCode: string
    modifiedCode: string
    language?: string
}

function generateDiffLines(original: string, modified: string): DiffLine[] {
    const originalLines = original.split('\n')
    const modifiedLines = modified.split('\n')
    const diffLines: DiffLine[] = []

    let oldLineNum = 1
    let newLineNum = 1

    // Simple diff algorithm (for demo - in production use a proper diff library)
    const maxLen = Math.max(originalLines.length, modifiedLines.length)

    for (let i = 0; i < maxLen; i++) {
        const origLine = originalLines[i]
        const modLine = modifiedLines[i]

        if (origLine === modLine) {
            // Context line (unchanged)
            if (origLine !== undefined) {
                diffLines.push({
                    type: 'context',
                    lineNumber: i + 1,
                    content: origLine,
                    oldLineNumber: oldLineNum++,
                    newLineNumber: newLineNum++
                })
            }
        } else {
            // Lines differ
            if (origLine !== undefined && modLine === undefined) {
                // Line removed
                diffLines.push({
                    type: 'remove',
                    lineNumber: i + 1,
                    content: origLine,
                    oldLineNumber: oldLineNum++
                })
            } else if (origLine === undefined && modLine !== undefined) {
                // Line added
                diffLines.push({
                    type: 'add',
                    lineNumber: i + 1,
                    content: modLine,
                    newLineNumber: newLineNum++
                })
            } else {
                // Line modified (show as remove + add)
                diffLines.push({
                    type: 'remove',
                    lineNumber: i + 1,
                    content: origLine,
                    oldLineNumber: oldLineNum++
                })
                diffLines.push({
                    type: 'add',
                    lineNumber: i + 1,
                    content: modLine,
                    newLineNumber: newLineNum++
                })
            }
        }
    }

    return diffLines
}

export function InlineDiff({ originalCode, modifiedCode, language = 'java' }: InlineDiffProps) {
    const diffLines = generateDiffLines(originalCode, modifiedCode)

    return (
        <div className="border rounded-lg overflow-hidden bg-card">
            <div className="bg-muted px-4 py-2 border-b">
                <p className="text-sm font-medium">Code Comparison</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm font-mono">
                    <tbody>
                        {diffLines.map((line, idx) => (
                            <tr
                                key={idx}
                                className={cn(
                                    "hover:bg-muted/50",
                                    line.type === 'add' && "bg-green-50 dark:bg-green-950/20",
                                    line.type === 'remove' && "bg-red-50 dark:bg-red-950/20"
                                )}
                            >
                                {/* Old Line Number */}
                                <td className="px-2 py-1 text-right text-muted-foreground select-none w-12 border-r">
                                    {line.oldLineNumber || ''}
                                </td>

                                {/* New Line Number */}
                                <td className="px-2 py-1 text-right text-muted-foreground select-none w-12 border-r">
                                    {line.newLineNumber || ''}
                                </td>

                                {/* Diff Indicator */}
                                <td className="px-2 py-1 w-8 select-none border-r">
                                    {line.type === 'add' && (
                                        <span className="text-green-600 dark:text-green-400">+</span>
                                    )}
                                    {line.type === 'remove' && (
                                        <span className="text-red-600 dark:text-red-400">-</span>
                                    )}
                                    {line.type === 'context' && (
                                        <span className="text-muted-foreground"> </span>
                                    )}
                                </td>

                                {/* Code Content */}
                                <td className="px-4 py-1 whitespace-pre">
                                    <code className={cn(
                                        line.type === 'add' && "text-green-700 dark:text-green-300",
                                        line.type === 'remove' && "text-red-700 dark:text-red-300"
                                    )}>
                                        {line.content || ' '}
                                    </code>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
