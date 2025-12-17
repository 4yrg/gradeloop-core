"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { InstructorService } from "@/services/instructor.service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { DiffEditor } from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { AlertTriangle, CheckCircle2, XCircle, FileText, User } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function CIPASDiffPage() {
    const { id } = useParams()
    const submissionId = id as string
    const { theme } = useTheme()
    const [notes, setNotes] = useState("")
    const [selectedStatus, setSelectedStatus] = useState<'flagged' | 'reviewed' | 'false-positive'>('flagged')

    const { data: diffData, isLoading } = useQuery({
        queryKey: ['plagiarism-diff', submissionId],
        queryFn: () => InstructorService.getPlagiarismDiff(submissionId)
    })

    if (isLoading) {
        return <div className="p-8">Loading diff...</div>
    }

    if (!diffData) {
        return <div className="p-8">Diff not found</div>
    }

    const { report, submission1, submission2 } = diffData

    const handleMarkPlagiarism = async (status: string) => {
        try {
            await InstructorService.markPlagiarism(report.id, status, notes)
            toast.success(`Marked as ${status.replace('-', ' ')}`)
        } catch (error) {
            toast.error("Failed to update status")
        }
    }

    const originalCode = submission1?.files?.[0]?.content || "// Original code not available"
    const matchedCode = submission2?.files?.[0]?.content || "// Matched code not available"

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-600" />
                                Plagiarism Detection Report
                            </CardTitle>
                            <CardDescription className="mt-2">
                                Side-by-side comparison of similar code submissions
                            </CardDescription>
                        </div>
                        <Badge variant={
                            report.similarityPercentage > 70 ? 'destructive' :
                                report.similarityPercentage > 50 ? 'default' : 'secondary'
                        } className="text-lg px-3 py-1">
                            {report.similarityPercentage}% Similar
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Original Submission
                            </h4>
                            <div className="text-sm text-muted-foreground">
                                <p>ID: {report.submissionId}</p>
                                <p>Student: {submission1?.studentId}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Matched Submission
                            </h4>
                            <div className="text-sm text-muted-foreground">
                                <p>ID: {report.matchedSubmissionId}</p>
                                <p>Student: {submission2?.studentId}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Matched Blocks Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Matched Code Blocks</CardTitle>
                    <CardDescription>
                        {report.matchedBlocks?.length || 0} similar code block(s) detected
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {report.matchedBlocks?.map((block: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border">
                                <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                    <span className="text-sm font-bold text-orange-600">{idx + 1}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">
                                        Lines {block.startLine} - {block.endLine}
                                    </p>
                                    <p className="text-xs text-muted-foreground font-mono">
                                        {block.matchedCode}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Diff Viewer */}
            <Card>
                <CardHeader>
                    <CardTitle>Code Comparison</CardTitle>
                    <CardDescription>Side-by-side diff view</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <DiffEditor
                            height="600px"
                            language="java"
                            original={originalCode}
                            modified={matchedCode}
                            theme={theme === 'dark' ? 'vs-dark' : 'light'}
                            options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                renderSideBySide: true,
                                scrollBeyondLastLine: false,
                            }}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Review Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Review & Mark</CardTitle>
                    <CardDescription>Classify this plagiarism report</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="notes">Review Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Add notes about this case..."
                            rows={4}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleMarkPlagiarism('flagged')}
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Confirm Plagiarism
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleMarkPlagiarism('false-positive')}
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Mark as False Positive
                        </Button>
                    </div>

                    <div className="pt-4 border-t">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Current Status:</span>
                            <Badge variant="outline">{report.status.replace('-', ' ').toUpperCase()}</Badge>
                        </div>
                        {report.reviewedBy && (
                            <p className="text-xs text-muted-foreground mt-2">
                                Reviewed by: {report.reviewedBy}
                            </p>
                        )}
                        {report.reviewNotes && (
                            <p className="text-sm mt-2 p-3 rounded-lg bg-muted">
                                {report.reviewNotes}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
