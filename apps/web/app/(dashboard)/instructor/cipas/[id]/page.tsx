"use client"

import { DiffEditor } from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertOctagon, Check, X } from "lucide-react"
import Link from "next/link"

export default function CIPASDiffPage() {
    const { theme } = useTheme()

    const originalCode = `def fibonacci(n):
    if n <= 1:
        return n
    else:
        return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))`

    const modifiedCode = `def fib(num):
    # Calculate fib sequence
    if num <= 1:
        return num
    else:
        return fib(num-1) + fib(num-2)

print(fib(10))`

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* Header */}
            <header className="h-16 border-b flex items-center justify-between px-6 bg-background shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/instructor/cipas">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold flex items-center gap-2">
                            Comparison Result
                            <Badge variant="destructive" className="ml-2">High Similarity: 88%</Badge>
                        </h1>
                        <p className="text-xs text-muted-foreground">Alice Cooper (Left) vs. Bob Smith (Right)</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end mr-4">
                        <span className="text-sm font-medium">Type 3 Clone Detected</span>
                        <span className="text-xs text-muted-foreground">Variable renaming & comments added</span>
                    </div>
                    <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                        <Check className="mr-2 h-4 w-4" /> Dismiss
                    </Button>
                    <Button variant="destructive">
                        <AlertOctagon className="mr-2 h-4 w-4" /> Confirm Plagiarism
                    </Button>
                </div>
            </header>

            {/* Diff View */}
            <main className="flex-1 overflow-hidden p-4">
                <Card className="h-full flex flex-col">
                    <CardHeader className="py-3 px-4 border-b bg-muted/20">
                        <div className="flex justify-between items-center text-sm font-medium">
                            <span>Original Submission (Alice)</span>
                            <span>Suspected Clone (Bob)</span>
                        </div>
                    </CardHeader>
                    <div className="flex-1 relative">
                        <DiffEditor
                            height="100%"
                            language="python"
                            original={originalCode}
                            modified={modifiedCode}
                            theme={theme === 'dark' ? 'vs-dark' : 'light'}
                            options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                renderSideBySide: true,
                            }}
                        />
                    </div>
                </Card>
            </main>
        </div>
    )
}
