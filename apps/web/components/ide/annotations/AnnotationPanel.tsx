"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircleCode, CheckCircle, XCircle } from "lucide-react"

export function AnnotationPanel() {
    const annotations = [
        { id: 1, file: 'main.py', line: 4, text: "Consider using a more descriptive variable name here instead of 'n'.", author: "AI Coach", type: 'suggestion' },
        { id: 2, file: 'main.py', line: 5, text: "Good use of base case for recursion.", author: "Instructor", type: 'praise' },
    ]

    return (
        <div className="h-full flex flex-col bg-background">
            <div className="h-9 px-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0 border-b select-none">
                <span>Annotations</span>
                <Badge variant="secondary" className="text-[10px] h-4 px-1">{annotations.length}</Badge>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {annotations.map(note => (
                        <Card key={note.id} className="text-sm">
                            <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0">
                                <div className="font-semibold flex items-center gap-2">
                                    <MessageCircleCode className="h-4 w-4 text-primary" />
                                    <span>line {note.line}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{note.file}</span>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                                <p className="text-muted-foreground mb-2">{note.text}</p>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-medium text-foreground">{note.author}</span>
                                    {note.type === 'suggestion' ? (
                                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/20">Suggestion</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-green-500 border-green-500/20">Praise</Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {annotations.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                            <p>No annotations yet.</p>
                            <p className="text-xs mt-2">Select code and right-click to add one.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
