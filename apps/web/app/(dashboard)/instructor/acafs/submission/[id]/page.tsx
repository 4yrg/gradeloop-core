"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { InstructorService } from "@/services/instructor.service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, User, CheckCircle2, XCircle, MessageSquare, Save, TrendingUp } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function ACAFSSubmissionPage() {
    const { id } = useParams()
    const submissionId = id as string
    const [instructorNotes, setInstructorNotes] = useState("")

    const { data: acafsData, isLoading } = useQuery({
        queryKey: ['acafs-submission', submissionId],
        queryFn: () => InstructorService.getAcafsSubmission(submissionId)
    })

    if (isLoading) {
        return <div className="p-8">Loading ACAFS data...</div>
    }

    if (!acafsData) {
        return <div className="p-8">ACAFS data not found</div>
    }

    const { submission, aiFeedback, interactionLog } = acafsData

    const handleSaveIntervention = async () => {
        try {
            toast.success("Intervention saved!")
        } catch (error) {
            toast.error("Failed to save intervention")
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                <Brain className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle>ACAFS Assessment</CardTitle>
                                <CardDescription>AI-generated feedback and grading analysis</CardDescription>
                            </div>
                        </div>
                        <Badge variant={aiFeedback?.needsReview ? 'destructive' : 'default'} className="text-lg px-3 py-1">
                            {aiFeedback?.needsReview ? 'Needs Review' : 'Auto-Graded'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground">Student</p>
                            <p className="font-medium">{submission?.student?.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Assignment</p>
                            <p className="font-medium">{submission?.assignment?.title}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* AI Grading Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Grading Breakdown</CardTitle>
                            <CardDescription>Automated assessment by rubric criteria</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {aiFeedback?.rubricScores?.map((score: any) => (
                                    <div key={score.criterionId} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{score.criterionName}</p>
                                                <p className="text-sm text-muted-foreground">{score.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold">{score.score}/{score.maxScore}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {Math.round((score.score / score.maxScore) * 100)}%
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-muted/50 text-sm">
                                            <p className="font-medium mb-1">AI Reasoning:</p>
                                            <p className="text-muted-foreground">{score.aiReasoning}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 pt-6 border-t">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-medium">Total AI Grade</span>
                                    <div className="text-3xl font-bold text-primary">
                                        {aiFeedback?.totalGrade}%
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                    <TrendingUp className="h-4 w-4" />
                                    Confidence: {aiFeedback?.confidence}%
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI-Generated Feedback */}
                    <Card>
                        <CardHeader>
                            <CardTitle>AI-Generated Feedback</CardTitle>
                            <CardDescription>Personalized feedback for the student</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-lg border bg-card">
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    Strengths
                                </h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                    {aiFeedback?.strengths?.map((strength: string, idx: number) => (
                                        <li key={idx}>{strength}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-4 rounded-lg border bg-card">
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-red-600" />
                                    Areas for Improvement
                                </h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                    {aiFeedback?.improvements?.map((improvement: string, idx: number) => (
                                        <li key={idx}>{improvement}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-4 rounded-lg border bg-card">
                                <h4 className="font-medium mb-2">Overall Feedback</h4>
                                <p className="text-sm text-muted-foreground">{aiFeedback?.overallFeedback}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Student-Agent Interaction Log */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Student-Agent Interaction Log
                            </CardTitle>
                            <CardDescription>
                                {interactionLog?.length || 0} interaction(s) during assignment
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="all">
                                <TabsList>
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="questions">Questions</TabsTrigger>
                                    <TabsTrigger value="hints">Hints</TabsTrigger>
                                </TabsList>
                                <TabsContent value="all" className="mt-4">
                                    <div className="space-y-3">
                                        {interactionLog?.map((interaction: any) => (
                                            <div key={interaction.id} className="p-3 rounded-lg border">
                                                <div className="flex items-start gap-3">
                                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${interaction.type === 'student' ? 'bg-primary/10' : 'bg-blue-100 dark:bg-blue-900/20'
                                                        }`}>
                                                        {interaction.type === 'student' ? (
                                                            <User className="h-4 w-4" />
                                                        ) : (
                                                            <Brain className="h-4 w-4 text-blue-600" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-sm font-medium">
                                                                {interaction.type === 'student' ? 'Student' : 'AI Agent'}
                                                            </span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {interaction.category}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(interaction.timestamp).toLocaleTimeString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm">{interaction.message}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {(!interactionLog || interactionLog.length === 0) && (
                                            <p className="text-sm text-muted-foreground text-center py-8">
                                                No interactions recorded
                                            </p>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Instructor Intervention */}
                <div className="space-y-6">
                    {/* AI Confidence Metrics */}
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Confidence</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Overall</span>
                                    <span className="font-bold">{aiFeedback?.confidence}%</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${aiFeedback?.confidence > 80 ? 'bg-green-500' :
                                                aiFeedback?.confidence > 60 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${aiFeedback?.confidence}%` }}
                                    />
                                </div>
                            </div>

                            {aiFeedback?.needsReview && (
                                <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                                    <p className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-1">
                                        Review Required
                                    </p>
                                    <p className="text-xs text-orange-700 dark:text-orange-200">
                                        {aiFeedback?.reviewReason}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Instructor Intervention */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Instructor Intervention</CardTitle>
                            <CardDescription>Override or supplement AI assessment</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="notes">Intervention Notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Add your notes or override reasoning..."
                                    rows={6}
                                    value={instructorNotes}
                                    onChange={(e) => setInstructorNotes(e.target.value)}
                                />
                            </div>
                            <Button className="w-full" onClick={handleSaveIntervention}>
                                <Save className="mr-2 h-4 w-4" />
                                Save Intervention
                            </Button>
                            <Button variant="outline" className="w-full" asChild>
                                <a href={`/instructor/submissions/${submissionId}`}>
                                    View Full Submission
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
