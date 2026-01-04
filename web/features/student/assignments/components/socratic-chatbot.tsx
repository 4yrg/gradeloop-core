"use client";

import { useState, useRef, useEffect } from "react";
import {
    Bot,
    ChevronDown,
    MessageSquare,
    Send,
    Sparkles,
    User,
    X,
    History,
    Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "bot";
    content: string;
    timestamp: Date;
}

export function SocraticChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "bot",
            content: "Hello! I'm your Socratic helper. I won't give you the answer, but I can help you find it. What are you struggling with?",
            timestamp: new Date(),
        },
    ]);
    const [hintLevel, setHintLevel] = useState("standard");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
        }
    }, [messages, isOpen]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");

        // Mock bot response
        setTimeout(() => {
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "bot",
                content: "That's a good question. Have you considered how the balancing logic affects the height of the subtree after an insertion?",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, botMsg]);
        }, 1000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            {isOpen && (
                <Card className="w-[400px] h-[500px] shadow-2xl border-2 flex flex-col animate-in slide-in-from-bottom-5 duration-300">
                    <CardHeader className="p-4 border-b bg-primary text-primary-foreground rounded-t-lg flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-bold">Socratic Helper</CardTitle>
                                <p className="text-[10px] opacity-80 uppercase tracking-widest font-semibold">Guided Learning</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-primary-foreground hover:bg-white/20 h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <div className="px-4 py-2 bg-muted/50 border-b flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Lightbulb className="h-3 w-3 text-amber-500" />
                            <span className="text-[10px] font-bold uppercase text-muted-foreground">Hint Level</span>
                        </div>
                        <Select value={hintLevel} onValueChange={setHintLevel}>
                            <SelectTrigger className="h-6 w-24 text-[10px] bg-background">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Subtle</SelectItem>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="high">Direct</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <CardContent className="flex-1 overflow-hidden p-0">
                        <div className="h-full overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                            {messages.map((m) => (
                                <div key={m.id} className={cn("flex gap-3", m.role === 'user' ? "flex-row-reverse" : "")}>
                                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", m.role === 'bot' ? "bg-primary/10" : "bg-muted")}>
                                        {m.role === 'bot' ? <Bot className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-muted-foreground" />}
                                    </div>
                                    <div className={cn("max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed", m.role === 'bot' ? "bg-muted/50 rounded-tl-none" : "bg-primary text-primary-foreground rounded-tr-none")}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 border-t bg-muted/20">
                        <div className="flex w-full gap-2">
                            <Input
                                placeholder="Ask for guidance..."
                                className="flex-1 bg-background"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardFooter>
                    <div className="px-4 py-1 text-[9px] text-center text-muted-foreground border-t">
                        Used 2 / 10 hints today • Resets in 14h
                    </div>
                </Card>
            )}
            <Button
                size="lg"
                className={cn("rounded-full h-14 w-14 shadow-2xl transition-all duration-300 hover:scale-110", isOpen ? "bg-destructive hover:bg-destructive rotate-90" : "bg-primary")}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
            </Button>
        </div>
    );
}
