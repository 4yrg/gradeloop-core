"use client"

import { useIdeStore } from "@/store/ide/use-ide-store"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, MessageCircleCode } from "lucide-react"
import { useRef } from "react"

export function EditorPopups() {
    const { activePopup, activeSelection, setActivePopup, setActiveSelection, addAnnotation } = useIdeStore()
    const annotationRef = useRef<HTMLTextAreaElement>(null)

    const existingAnnotation = useIdeStore(state =>
        state.annotations.find(a =>
            a.fileId === activeSelection?.fileId &&
            a.line === activeSelection?.line
        ) // Basic matching logic
    )

    const isOpen = activePopup !== null
    const close = () => {
        setActivePopup(null)
        setActiveSelection(null)
    }

    const handleSaveAnnotation = () => {
        if (!activeSelection || !annotationRef.current?.value) return

        if (existingAnnotation) {
            useIdeStore.getState().addComment(existingAnnotation.id, {
                id: Date.now().toString(),
                author: "Student", // In real app, get from auth
                text: annotationRef.current.value,
                timestamp: Date.now()
            })
        } else {
            addAnnotation({
                id: Date.now().toString(),
                fileId: activeSelection.fileId,
                line: activeSelection.line,
                endLine: activeSelection.endLine,
                content: activeSelection.code, // Add content field
                comments: [{
                    id: Date.now().toString(),
                    author: "Student",
                    text: annotationRef.current.value,
                    timestamp: Date.now()
                }]
            })
        }
        close()
    }

    if (!activeSelection) return null

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
            <DialogContent className="sm:max-w-md">
                {activePopup === 'annotation' && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <MessageCircleCode className="h-5 w-5" />
                                {existingAnnotation ? 'Discussion' : 'Add Annotation'}
                            </DialogTitle>
                            <DialogDescription>
                                {existingAnnotation
                                    ? `Discussion for lines ${existingAnnotation.line}-${existingAnnotation.endLine || existingAnnotation.line}`
                                    : `Add a comment or suggestion for lines ${activeSelection.line}-${activeSelection.endLine || activeSelection.line}`
                                }
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="bg-muted p-2 rounded-md text-xs font-mono max-h-32 overflow-auto whitespace-pre">
                                {activeSelection.code}
                            </div>

                            {existingAnnotation && (
                                <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                                    <div className="flex flex-col gap-4">
                                        {existingAnnotation.comments.map((comment) => (
                                            <div key={comment.id} className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="font-semibold text-foreground">{comment.author}</span>
                                                    <span>{new Date(comment.timestamp).toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm">{comment.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}

                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="message">{existingAnnotation ? 'Reply' : 'Your Annotation'}</Label>
                                <Textarea
                                    placeholder={existingAnnotation ? "Type your reply..." : "Type your message here."}
                                    id="message"
                                    ref={annotationRef}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="secondary" onClick={close}>Cancel</Button>
                            <Button onClick={handleSaveAnnotation}>
                                {existingAnnotation ? 'Post Reply' : 'Save Annotation'}
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {activePopup === 'ask-ai' && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Bot className="h-5 w-5" />
                                Ask GradeLoop AI
                            </DialogTitle>
                            <DialogDescription>
                                Get help with the selected code snippet.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="bg-muted p-2 rounded-md text-xs font-mono max-h-32 overflow-auto whitespace-pre">
                                {activeSelection.code}
                            </div>
                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="ai-prompt">What would you like to know?</Label>
                                <Textarea
                                    placeholder="e.g., Explain this code, Optimize this loop..."
                                    id="ai-prompt"
                                    defaultValue="Explain this code and suggest improvements."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="secondary" onClick={close}>Cancel</Button>
                            <Button onClick={close}>Ask AI</Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
