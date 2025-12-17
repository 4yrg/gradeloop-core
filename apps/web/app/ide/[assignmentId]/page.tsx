"use client"

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { CodeEditor } from "@/components/ide/CodeEditor"
import { useIDEStore } from "@/store/useIDEStore"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Play, File, Bug, SquareTerminal, ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function IDEPage() {
    const params = useParams()
    const assignmentId = params.assignmentId as string
    const { files, activeFile, setActiveFile } = useIDEStore()

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
            {/* IDE Header */}
            <header className="h-14 border-b flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/student/assignments/${assignmentId}`}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="font-semibold text-sm">Lab 2: Loops & Arrays</h2>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            Student Mode
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm">
                        <Save className="mr-2 h-4 w-4" /> Save
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <Play className="mr-2 h-4 w-4" /> Run Code
                    </Button>
                    <Button size="sm">Submit</Button>
                </div>
            </header>

            {/* Main Layout */}
            <main className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal">

                    {/* Sidebar: Files */}
                    <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="border-r">
                        <div className="flex flex-col h-full">
                            <div className="p-3 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Explorer
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="flex flex-col p-2 space-y-1">
                                    {files.map(file => (
                                        <Button
                                            key={file.name}
                                            variant={activeFile?.name === file.name ? "secondary" : "ghost"}
                                            onClick={() => setActiveFile(file)}
                                            className={
                                                activeFile?.name === file.name
                                                    ? "w-full justify-start h-auto py-2 text-foreground"
                                                    : "w-full justify-start h-auto py-2 text-muted-foreground"
                                            }
                                        >
                                            <File className="mr-2 h-4 w-4" />
                                            {file.name}
                                        </Button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Editor Area */}
                    <ResizablePanel defaultSize={50} minSize={30}>
                        <CodeEditor />
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Right Panel: Terminal / AI */}
                    <ResizablePanel defaultSize={30} minSize={20} className="border-l bg-card">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center border-b px-2">
                                <Button variant="ghost" size="sm" className="gap-2 rounded-none border-b-2 border-primary h-10">
                                    <SquareTerminal className="h-4 w-4" /> Output
                                </Button>
                                <Button variant="ghost" size="sm" className="gap-2 rounded-none h-10 text-muted-foreground">
                                    <Bug className="h-4 w-4" /> Problems
                                </Button>
                            </div>
                            <div className="flex-1 p-4 font-mono text-sm">
                                <div className="text-muted-foreground">$ python main.py</div>
                                <div className="mt-2 text-green-500">Hello GradeLoop</div>
                                <div className="animate-pulse mt-1">_</div>
                            </div>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </main>

            {/* Status Bar */}
            <footer className="h-6 border-t bg-muted/30 text-xs flex items-center px-4 justify-between text-muted-foreground">
                <div className="flex gap-4">
                    <span>Ready</span>
                    <span>Python 3.10</span>
                </div>
                <div>
                    Ln 12, Col 45
                </div>
            </footer>
        </div>
    )
}
