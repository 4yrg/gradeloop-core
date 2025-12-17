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
import { Editor } from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { Play, Save, MessageSquare, CheckCircle2, XCircle } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function InstructorIDEPage() {
    const { id } = useParams()
    const submissionId = id as string
    const { theme } = useTheme()
    const [feedback, setFeedback] = useState("")
    const [grade, setGrade] = useState("")
    const [selectedFile, setSelectedFile] = useState(0)

    const { data: submission } = useQuery({
        queryKey: ['ide-submission', submissionId],
        queryFn: () => InstructorService.getSubmissionDetail(submissionId)
    })

    const handleSaveGrade = async () => {
        try {
            await InstructorService.updateGrade(submissionId, parseInt(grade), feedback)
            toast.success("Grade saved successfully")
        } catch (error) {
            toast.error("Failed to save grade")
        }
    }

    if (!submission) {
        return <div className="p-8">Loading...</div>
    }

    const files = submission.files || []
    const currentFile = files[selectedFile]

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* Top Bar */}
            <div className="border-b bg-card p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">{submission.assignment?.title}</h2>
                        <p className="text-sm text-muted-foreground">
                            Student: {submission.student?.name} • {submission.student?.email}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={submission.status === 'GRADED' ? 'default' : 'secondary'}>
                            {submission.status}
                        </Badge>
                        {submission.grade && (
                            <Badge variant="outline">{submission.grade}%</Badge>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Code Editor */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* File Tabs */}
                    <div className="border-b bg-muted/30 px-4 py-2 flex gap-2 overflow-x-auto">
                        {files.map((file: any, idx: number) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedFile(idx)}
                                className={`px-3 py-1 rounded text-sm ${selectedFile === idx
                                        ? 'bg-background border'
                                        : 'hover:bg-background/50'
                                    }`}
                            >
                                {file.name}
                            </button>
                        ))}
                    </div>

                    {/* Monaco Editor */}
                    <div className="flex-1 overflow-hidden">
                        <Editor
                            height="100%"
                            language={submission.assignment?.language?.toLowerCase() || 'java'}
                            value={currentFile?.content || '// No file selected'}
                            theme={theme === 'dark' ? 'vs-dark' : 'light'}
                            options={{
                                readOnly: true,
                                minimap: { enabled: true },
                                fontSize: 14,
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                            }}
                        />
                    </div>
                </div>

                {/* Right Sidebar - Grading Panel */}
                <div className="w-96 border-l bg-card overflow-y-auto">
                    <Tabs defaultValue="grade" className="h-full flex flex-col">
                        <TabsList className="w-full rounded-none">
                            <TabsTrigger value="grade" className="flex-1">Grade</TabsTrigger>
                            <TabsTrigger value="tests" className="flex-1">Tests</TabsTrigger>
                            <TabsTrigger value="comments" className="flex-1">Comments</TabsTrigger>
                        </TabsList>

                        {/* Grade Tab */}
                        <TabsContent value="grade" className="flex-1 p-4 space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Auto-Grade Results</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Test Cases</span>
                                        <Badge>{submission.testsPassed}/{submission.totalTests}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Calculated Grade</span>
                                        <Badge variant="outline">{submission.autoGrade}%</Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-2">
                                <Label htmlFor="grade">Final Grade (%)</Label>
                                <Input
                                    id="grade"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={grade}
                                    onChange={(e) => setGrade(e.target.value)}
                                    placeholder={submission.grade?.toString() || submission.autoGrade?.toString()}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="feedback">Feedback</Label>
                                <Textarea
                                    id="feedback"
                                    rows={8}
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Provide feedback to the student..."
                                />
                            </div>

                            <Button className="w-full" onClick={handleSaveGrade}>
                                <Save className="mr-2 h-4 w-4" />
                                Save Grade & Feedback
                            </Button>
                        </TabsContent>

                        {/* Tests Tab */}
                        <TabsContent value="tests" className="flex-1 p-4 space-y-3 overflow-y-auto">
                            {submission.testResults?.map((test: any, idx: number) => (
                                <Card key={idx}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm">Test {idx + 1}</CardTitle>
                                            {test.passed ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-600" />
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Input</p>
                                            <pre className="text-xs bg-muted p-2 rounded mt-1">{test.input}</pre>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Expected</p>
                                            <pre className="text-xs bg-muted p-2 rounded mt-1">{test.expected}</pre>
                                        </div>
                                        {!test.passed && (
                                            <div>
                                                <p className="text-xs text-muted-foreground">Actual</p>
                                                <pre className="text-xs bg-red-50 dark:bg-red-950/20 p-2 rounded mt-1 text-red-600">
                                                    {test.actual}
                                                </pre>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </TabsContent>

                        {/* Comments Tab */}
                        <TabsContent value="comments" className="flex-1 p-4 space-y-3 overflow-y-auto">
                            {submission.comments?.map((comment: any, idx: number) => (
                                <Card key={idx}>
                                    <CardContent className="pt-4">
                                        <div className="flex items-start gap-2">
                                            <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground" />
                                            <div className="flex-1">
                                                <p className="text-sm">{comment.text}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Line {comment.lineNumber} • {comment.author}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {(!submission.comments || submission.comments.length === 0) && (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No comments yet
                                </p>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
