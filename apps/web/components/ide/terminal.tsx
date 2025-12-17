"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { TerminalSquare } from "lucide-react"

interface TerminalProps {
    output: string[]
}

export function Terminal({ output }: TerminalProps) {
    return (
        <div className="h-full flex flex-col bg-slate-950 text-slate-50 font-mono text-sm">
            <div className="flex items-center space-x-2 border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-400">
                <TerminalSquare className="h-4 w-4" />
                <span>Terminal</span>
            </div>
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-1">
                    {output.map((line, i) => (
                        <div key={i} className="whitespace-pre-wrap break-all">
                            {line.startsWith('$') ? (
                                <span className="text-yellow-400">{line}</span>
                            ) : line.startsWith('Error') || line.includes('Exception') ? (
                                <span className="text-red-400">{line}</span>
                            ) : (
                                <span className="text-slate-300">{line}</span>
                            )}
                        </div>
                    ))}
                    <div className="h-4 w-2 animate-pulse bg-slate-500" />
                </div>
            </ScrollArea>
        </div>
    )
}
