"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ChevronRight } from "lucide-react"
import { PlagiarismFlag } from "@/types/instructor"

interface PlagiarismFlagsWidgetProps {
    flags: PlagiarismFlag[]
}

export function PlagiarismFlagsWidget({ flags }: PlagiarismFlagsWidgetProps) {
    return (
        <Card className="col-span-1 border-red-200 dark:border-red-900/50">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    Plagiarism Alerts
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-4">
                        {flags.map((flag) => (
                            <div key={flag.id} className="flex flex-col gap-2 rounded-lg border border-red-100 bg-red-50/50 dark:bg-red-900/20 dark:border-red-900/50 p-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold">{flag.studentName}</span>
                                        <span className="text-xs text-muted-foreground">{flag.assignmentTitle} • {flag.courseCode}</span>
                                    </div>
                                    <div className="text-sm font-bold text-red-600">
                                        {flag.similarityScore}%
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Match: <span className="font-medium">{flag.matchedSource}</span>
                                </div>
                                <Button size="sm" variant="outline" className="w-full h-7 text-xs mt-1 border-red-200 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/40">
                                    View Report <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                            </div>
                        ))}
                        {flags.length === 0 && (
                            <div className="text-sm text-muted-foreground text-center py-4">
                                No alerts found.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
