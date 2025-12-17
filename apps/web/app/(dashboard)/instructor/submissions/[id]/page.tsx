"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { InstructorService } from "@/services/instructor.service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
    User,
    Calendar,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    MessageSquare,
    Save,
    AlertTriangle
} from "lucide-react"
import Editor from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { useState } from "react"
import { toast } from "sonner"

export default function SubmissionReviewPage() {
    const { id } = useParams()
    const submissionId = id as string
    const { theme } = useTheme()
    const [feedback, setFeedback] = useState("")
    const [overrideGrade, setOverrideGrade] = useState("")

    const { data: submission, isLoading } = useQuery({
        queryKey: ['submission-details', submissionId],
        queryFn: () => InstructorService.getSubmissionDetails(submissionId)
    })

    const [rubricScores, setRubricScores] = useState<Record<string, { score: number; comment: string }>>({})

    if (isLoading) {
        return <div className="p-8">Loading submission...</div>
    }

    if (!submission) {
        return <div className="p-8">Submission not found</div>
    }

    const handleSaveGrade = async () => {
        try {
            await InstructorService.updateGrade(submissionId, {
                rubricScores,
                feedback,
                overrideGrade: overrideGrade ? parseFloat(overrideGrade) : undefined
            })
            toast.success("Grade saved successfully!")
        } catch (error) {
            toast.error("Failed to save grade")
        }
    }

    const handleAddComment = async (line: number, text: string) => {
        try {
            await InstructorService.addComment(submissionId, { line, text })
            toast.success("Comment added!")
        } catch (error) {
            toast.error("Failed to add comment")
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Student Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle>{submission.student?.name}</CardTitle>
                                    <CardDescription>{submission.student?.email}</CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <FileText className="h-4 w-4" />
                                    {submission.assignment?.title}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Submitted: {new Date(submission.submittedAt).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <Badge variant={submission.status === 'graded' ? 'default' : 'secondary'} className="text-lg px-3 py-1">
                                {submission.status.toUpperCase()}
                            </Badge>
                            {submission.grade !== undefined && (
                                <div className="text-2xl font-bold">{submission.grade}%</div>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content - Code & Tests */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Code Viewer */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Submitted Code</CardTitle>
                            <CardDescription>
                                {submission.files?.length || 0} file(s) submitted
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue={submission.files?.[0]?.name || 'code'}>
                                <TabsList>
                                    {submission.files?.map((file: any) => (
                                        <TabsTrigger key={file.name} value={file.name}>
                                            {file.name}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                {submission.files?.map((file: any) => (
                                    <TabsContent key={file.name} value={file.name} className="mt-4">
                                        <div className="border rounded-lg overflow-hidden">
                                            <Editor
                                                height="400px"
                                                language={file.language || 'java'}
                                                value={file.content}
                                                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                                                options={{
                                                    readOnly: true,
                                                    minimap: { enabled: false },
                                                    lineNumbers: 'on',
                                                    scrollBeyondLastLine: false,
                                                }}
                                            />
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Test Results */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Test Results</CardTitle>
                            <CardDescription>
                                {submission.testResults?.filter((t: any) => t.passed).length || 0} / {submission.testResults?.length || 0} tests passed
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {submission.testResults?.map((test: any, idx: number) => (
                                    <div key={test.testId} className="flex items-start gap-3 p-3 rounded-lg border">
                                        {test.passed ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                        )}
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <span className="font-medium">Test Case {idx + 1}</span>
                                                {test.executionTime && (
                                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {test.executionTime}ms
                                                    </span>
                                                )}
                                            </div>
                                            {!test.passed && test.actualOutput && (
                                                <div className="mt-2 text-sm">
                                                    <p className="text-muted-foreground">Expected: {test.expectedOutput}</p>
                                                    <p className="text-red-600">Got: {test.actualOutput}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Inline Comments */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Comments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {submission.comments?.map((comment: any) => (
                                    <div key={comment.id} className="p-3 rounded-lg border">
                                        {comment.line && (
                                            <Badge variant="outline" className="mb-2">Line {comment.line}</Badge>
                                        )}
                                        <p className="text-sm">{comment.text}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(comment.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                                {(!submission.comments || submission.comments.length === 0) && (
                                    <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Grading */}
                <div className="space-y-6">
                    {/* Auto-Grade Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Auto-Grade</CardTitle>
                            <CardDescription>Automated assessment results</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Test Cases</span>
                                    <span className="font-bold">
                                        {Math.round((submission.testResults?.filter((t: any) => t.passed).length / submission.testResults?.length) * 100)}%
                                    </span>
                                </div>
                                <Progress
                                    value={(submission.testResults?.filter((t: any) => t.passed).length / submission.testResults?.length) * 100}
                                />
                            </div>
                            {submission.plagiarismScore !== undefined && (
                                <div className="flex items-center justify-between p-3 rounded-lg border">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                                        <span className="text-sm">Plagiarism</span>
                                    </div>
                                    <Badge variant={submission.plagiarismScore > 50 ? 'destructive' : 'secondary'}>
                                        {submission.plagiarismScore}%
                                    </Badge>
                                </div>
                            )}
                            {submission.aiLikelihood !== undefined && (
                                <div className="flex items-center justify-between p-3 rounded-lg border">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm">AI-Generated</span>
                                    </div>
                                    <Badge variant={submission.aiLikelihood > 50 ? 'destructive' : 'secondary'}>
                                        {submission.aiLikelihood}%
                                    </Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Rubric Scoring */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Rubric Scoring</CardTitle>
                            <CardDescription>Manual grading criteria</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {submission.rubricScores?.map((rs: any) => (
                                <div key={rs.criterionId} className="space-y-2">
                                    <div className="flex justify-between items-start">
                                        <Label className="text-sm font-medium">Criterion {rs.criterionId}</Label>
                                        <Input
                                            type="number"
                                            className="w-16 h-8 text-right"
                                            value={rs.score}
                                            readOnly
                                        />
                                    </div>
                                    {rs.comment && (
                                        <p className="text-xs text-muted-foreground">{rs.comment}</p>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Feedback & Grade Override */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Instructor Feedback</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="feedback">Feedback</Label>
                                <Textarea
                                    id="feedback"
                                    placeholder="Provide feedback to the student..."
                                    rows={4}
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="override">Override Grade (%)</Label>
                                <Input
                                    id="override"
                                    type="number"
                                    placeholder="Optional"
                                    value={overrideGrade}
                                    onChange={(e) => setOverrideGrade(e.target.value)}
                                />
                            </div>
                            <Button className="w-full" onClick={handleSaveGrade}>
                                <Save className="mr-2 h-4 w-4" />
                                Save Grade
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
