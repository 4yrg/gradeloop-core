"use client"

import { useIdeStore } from "@/store/ide/use-ide-store"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, MessageCircleCode } from "lucide-react"

export function EditorPopups() {
    const { activePopup, activeSelection, setActivePopup, setActiveSelection } = useIdeStore()

    const isOpen = activePopup !== null
    const close = () => {
        setActivePopup(null)
        setActiveSelection(null)
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
                                Add Annotation
                            </DialogTitle>
                            <DialogDescription>
                                Add a comment or suggestion for lines {activeSelection.line}-{activeSelection.endLine || activeSelection.line}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="bg-muted p-2 rounded-md text-xs font-mono max-h-32 overflow-auto whitespace-pre">
                                {activeSelection.code}
                            </div>
                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="message">Your Annotation</Label>
                                <Textarea placeholder="Type your message here." id="message" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="secondary" onClick={close}>Cancel</Button>
                            <Button onClick={close}>Save Annotation</Button>
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
