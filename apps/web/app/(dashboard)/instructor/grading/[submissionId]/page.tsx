"use client"

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { CodeEditor } from "@/components/ide/CodeEditor"
import { GradingPanel } from "@/components/grading/GradingPanel"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play, Flag, ChevronRight, ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function GradingPage() {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* Grading Header */}
            <header className="h-14 border-b flex items-center justify-between px-4 bg-background shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/instructor">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="font-semibold text-sm">Reviewing: Alex Student</h2>
                        <p className="text-xs text-muted-foreground">Lab 2: Loops & Arrays</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                    </Button>
                    <div className="text-xs text-muted-foreground">1 of 24</div>
                    <Button variant="outline" size="sm">
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="destructive" size="sm">
                        <Flag className="mr-2 h-4 w-4" /> Report Plagiarism
                    </Button>
                    <Button size="sm" variant="secondary">
                        <Play className="mr-2 h-4 w-4" /> Run Student Code
                    </Button>
                </div>
            </header>

            {/* Grading Workspace */}
            <main className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal">
                    {/* File Explorer (Simplified for grading) */}
                    <ResizablePanel defaultSize={15} minSize={10} className="border-r hidden md:block">
                        <div className="p-3 text-xs font-semibold uppercase text-muted-foreground border-b">Files</div>
                        <div className="p-2 space-y-1">
                            <Button variant="secondary" className="w-full justify-start h-auto py-2 text-foreground font-normal">main.py</Button>
                            <Button variant="ghost" className="w-full justify-start h-auto py-2 text-muted-foreground font-normal">utils.py</Button>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle />

                    {/* Code View */}
                    <ResizablePanel defaultSize={55} minSize={30}>
                        <CodeEditor />
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Grading Tools */}
                    <ResizablePanel defaultSize={30} minSize={20}>
                        <GradingPanel />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </main>
        </div>
    )
}
