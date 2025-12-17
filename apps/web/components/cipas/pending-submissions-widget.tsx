"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { PendingSubmission } from "@/types/instructor"

interface PendingSubmissionsWidgetProps {
    submissions: PendingSubmission[]
}

export function PendingSubmissionsWidget({ submissions }: PendingSubmissionsWidgetProps) {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle className="text-lg">Pending Submissions</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-4">
                        {submissions.map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between rounded-lg border p-3">
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-semibold">{sub.studentName}</span>
                                    <span className="text-xs text-muted-foreground">{sub.assignmentTitle} • {sub.courseCode}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {new Date(sub.submittedAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50">
                                        <Check className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {submissions.length === 0 && (
                            <div className="text-sm text-muted-foreground text-center py-4">
                                No pending submissions.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
