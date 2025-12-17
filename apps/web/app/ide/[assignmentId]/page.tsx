"use client"

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { CodeEditor } from "@/components/ide/CodeEditor"
import { useIDEStore } from "@/store/useIDEStore"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Play, File, Bug, SquareTerminal, ArrowLeft, Save, Bot, Send } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { Input } from "@/components/ui/input"

export default function IDEPage() {
    const params = useParams()
    const router = useRouter()
    const assignmentId = params.assignmentId as string
    const { files, activeFile, setActiveFile } = useIDEStore()

    const [activeTab, setActiveTab] = useState<'output' | 'problems' | 'ai'>('output')
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
        { role: 'ai', content: "Hi! I'm your coding assistant. How can I help you with this assignment?" }
    ])
    const [input, setInput] = useState("")

    const handleSendMessage = () => {
        if (!input.trim()) return
        setMessages([...messages, { role: 'user', content: input }])
        // Mock AI response
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'ai', content: "That's a great question. Have you considered checking the boundary conditions for your loop?" }])
        }, 1000)
        setInput("")
    }

    const handleSubmit = () => {
        // Simulate submission
        router.push(`/student/assignments/${assignmentId}?status=submitted`)
    }

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-background animate-in fade-in duration-300">
            {/* IDE Header */}
            <header className="h-14 border-b flex items-center justify-between px-4 shrink-0 bg-card">
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
                    <Button size="sm" onClick={handleSubmit}>Submit Assignment</Button>
                </div>
            </header>

            {/* Main Layout */}
            <main className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal">

                    {/* Sidebar: Files */}
                    <ResizablePanel defaultSize={15} minSize={15} maxSize={25} className="border-r bg-card/50">
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
                                                    ? "w-full justify-start h-auto py-2 text-foreground font-medium bg-muted"
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

                    <ResizableHandle />

                    {/* Editor Area */}
                    <ResizablePanel defaultSize={60} minSize={30}>
                        <CodeEditor />
                    </ResizablePanel>

                    <ResizableHandle />

                    {/* Right Panel: Terminal / AI */}
                    <ResizablePanel defaultSize={25} minSize={20} className="border-l bg-card">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center border-b px-2 bg-muted/30">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setActiveTab('output')}
                                    className={`gap-2 rounded-none h-10 ${activeTab === 'output' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                                >
                                    <SquareTerminal className="h-4 w-4" /> Output
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setActiveTab('problems')}
                                    className={`gap-2 rounded-none h-10 ${activeTab === 'problems' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                                >
                                    <Bug className="h-4 w-4" /> Problems
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setActiveTab('ai')}
                                    className={`gap-2 rounded-none h-10 ${activeTab === 'ai' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                                >
                                    <Bot className="h-4 w-4" /> Assistant
                                </Button>
                            </div>

                            <div className="flex-1 overflow-hidden relative">
                                {activeTab === 'output' && (
                                    <div className="p-4 font-mono text-sm h-full overflow-y-auto">
                                        <div className="text-muted-foreground">$ python main.py</div>
                                        <div className="mt-2 text-green-500">Hello GradeLoop</div>
                                        <div className="mt-1">Build successful.</div>
                                    </div>
                                )}

                                {activeTab === 'problems' && (
                                    <div className="p-4 text-sm h-full overflow-y-auto">
                                        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-2">
                                            <Bug className="h-4 w-4" />
                                            <span className="font-medium">Warning: Unused variable 'x'</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground pl-6">Line 15, Column 4</div>
                                    </div>
                                )}

                                {activeTab === 'ai' && (
                                    <div className="flex flex-col h-full">
                                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                            {messages.map((m, i) => (
                                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] rounded-lg p-3 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                        {m.content}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-3 border-t">
                                            <div className="flex gap-2">
                                                <Input
                                                    value={input}
                                                    onChange={e => setInput(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                                    placeholder="Ask for help..."
                                                    className="h-8 text-sm"
                                                />
                                                <Button size="icon" className="h-8 w-8" onClick={handleSendMessage}>
                                                    <Send className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </main>

            {/* Status Bar */}
            <footer className="h-6 border-t bg-muted/30 text-xs flex items-center px-4 justify-between text-muted-foreground shrink-0">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-blue-500" /> Connect: Standard</span>
                    <span>Python 3.10</span>
                </div>
                <div>
                    Ln 12, Col 45 • UTF-8 • 2 Spaces
                </div>
            </footer>
        </div>
    )
}
