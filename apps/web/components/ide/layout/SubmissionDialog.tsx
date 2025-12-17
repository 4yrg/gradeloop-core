"use client"

import { useIdeStore } from "@/store/ide/use-ide-store"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, FileText, Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter, useParams } from "next/navigation"

export function SubmissionDialog() {
    const { activePopup, setActivePopup, files } = useIdeStore()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()
    const params = useParams()
    const assignmentId = params.id as string

    const isOpen = activePopup === 'submission'
    const close = () => setActivePopup(null)

    const handleSubmit = async () => {
        setIsSubmitting(true)

        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1500))

        console.log("Assignment submitted for ID:", assignmentId)
        console.log("Files submitted:", files.map(f => f.name))

        setIsSubmitting(false)
        close()

        // Redirect to assignment overview
        // We use replace to prevent going back to IDE with back button easily if that's desired, 
        // but push is standard.
        if (assignmentId) {
            router.push(`/student/assignments/${assignmentId}?submitted=true`)
        } else {
            console.error("No assignment ID found to redirect to")
            // Fallback
            router.push('/student/assignments')
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Submit Assignment</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to submit your solution?
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="flex flex-col gap-4">
                        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <FileText className="h-4 w-4" /> Files to submit
                                </span>
                                <span className="font-medium">{files.length}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <CheckCircle2 className="h-4 w-4" /> Tests Passing
                                </span>
                                <span className="text-green-600 font-medium">3/3 (Mock)</span>
                            </div>
                        </div>

                        <div className="flex gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-200 text-sm rounded-md items-start">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p>
                                Submitting will trigger an automated plagiarism check.
                                Ensure all code is your own work.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={close} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            'Confirm Submission'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
