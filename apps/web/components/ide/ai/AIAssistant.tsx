"use client"

import { useIdeStore } from "@/store/ide/use-ide-store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bot, User, Send, Sparkles, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function AIAssistant() {
    const { toggleAuxiliaryBar } = useIdeStore()
    const [input, setInput] = useState("")
    const [isThinking, setIsThinking] = useState(false)
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: "Hello! I'm your ACAFS coding assistant. I can help you explain code, fix bugs, or generate tests." }
    ])

    const handleSend = () => {
        if (!input.trim()) return

        const newMessages = [...messages, { role: 'user' as const, content: input }]
        setMessages(newMessages)
        setInput("")
        setIsThinking(true)

        // Mock response
        setTimeout(() => {
            setIsThinking(false)
            setMessages([...newMessages, {
                role: 'assistant',
                content: "I see you're working on the Fibonacci sequence. The current recursive implementation is O(2^n). Would you like to optimize it with memoization?"
            }])
        }, 1500)
    }

    return (
        <div className="h-full flex flex-col bg-background">
            <div className="h-9 px-4 flex items-center justify-between border-b shrink-0 bg-muted/20">
                <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                    <span>AI Assistant</span>
                </div>
                <button onClick={toggleAuxiliaryBar} className="p-1 hover:bg-muted-foreground/20 rounded">
                    <X className="h-3 w-3 text-muted-foreground" />
                </button>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                    {messages.map((m, i) => (
                        <div key={i} className="flex gap-3 text-sm">
                            <div className={cn(
                                "h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                m.role === 'assistant' ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
                            )}>
                                {m.role === 'assistant' ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                            </div>
                            <div className="space-y-1">
                                <span className="font-semibold text-xs text-muted-foreground block uppercase">
                                    {m.role === 'assistant' ? 'GradeLoop AI' : 'You'}
                                </span>
                                <div className="leading-relaxed text-foreground/90">
                                    {m.content}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                        <div className="flex gap-3 text-sm animate-pulse">
                            <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                                <Bot className="h-3.5 w-3.5 text-white" />
                            </div>
                            <div className="space-y-2 pt-1.5">
                                <div className="h-2 w-12 bg-muted rounded"></div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 border-t mt-auto space-y-3">
                <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setInput("Explain this code")}>Explain Code</Button>
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setInput("Fix bugs in this file")}>Fix Bugs</Button>
                </div>
                <div className="relative">
                    <Input
                        placeholder="Ask about your code..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        className="pr-10"
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-1 top-1 h-7 w-7 text-primary"
                        onClick={handleSend}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
