"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { StudentService } from "@/services/student.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, CheckCircle2, XCircle, Terminal, BookOpen, AlertCircle, Lightbulb, Code2, Maximize2, Minimize2 } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import ReactMarkdown from 'react-markdown'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export default function GradedAssignmentPage() {
    const params = useParams()
    const assignmentId = params.id as string

    const { data: submission, isLoading: submissionLoading } = useQuery({
        queryKey: ['submission', assignmentId],
        queryFn: () => StudentService.getSubmission(assignmentId)
    })

    const { data: assignment, isLoading: assignmentLoading } = useQuery({
        queryKey: ['assignment', assignmentId],
        queryFn: () => StudentService.getAssignmentDetails(assignmentId)
    })

    if (submissionLoading || assignmentLoading) {
        return <div className="flex h-[50vh] items-center justify-center">Loading results...</div>
    }

    if (!submission) {
        return <div className="p-8 text-center">Submission not found.</div>
    }

    const { scoreBreakdown, testResults, socraticFeedback } = submission
    const passedTests = testResults?.passed || 0
    const totalTests = testResults?.total || 0
    const passPercentage = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0

    return (
        <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Link href="/student" className="hover:text-primary transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <span>Back to Dashboard</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">{assignment?.title || 'Assignment Results'}</h1>
                    <p className="text-muted-foreground">
                        Submitted on {new Date(submission.submittedAt).toLocaleDateString()} • {assignment?.courseId}
                    </p>
                </div>
                <div className="flex gap-3">
                    {/* The request requires sandbox to be accessible AFTER evaluation. 
                         Placing it here is standard UX, but we can emphasize the review first. */}
                    <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg" asChild>
                        <Link href={`/ide/${assignmentId}?mode=sandbox`}>
                            <Terminal className="mr-2 h-4 w-4" /> Open Learning Sandbox
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* 1. Evaluation / Score Overview (Required FIRST) */}
                <Card className="md:col-span-3 border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            Evaluation Results
                        </CardTitle>
                        <CardDescription>Comprehensive breakdown of your code performance.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-8 md:grid-cols-4">
                        <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg border shadow-sm">
                            <span className="text-4xl font-extrabold text-primary">{scoreBreakdown?.overall || 0}%</span>
                            <span className="text-sm font-medium text-muted-foreground mt-1">Overall Score</span>
                        </div>
                        <div className="space-y-4 md:col-span-3 grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">Objectives & Logic</span>
                                    <span>{scoreBreakdown?.objectives}%</span>
                                </div>
                                <Progress value={scoreBreakdown?.objectives} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">Style & Readability</span>
                                    <span>{scoreBreakdown?.style}%</span>
                                </div>
                                <Progress value={scoreBreakdown?.style} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">Deep Analysis</span>
                                    <span>{scoreBreakdown?.analysis}%</span>
                                </div>
                                <Progress value={scoreBreakdown?.analysis} className="h-2" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Socratic Feedback (Tiered) */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="h-full border-l-4 border-l-blue-500">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Lightbulb className="h-5 w-5 text-blue-500" />
                                    AI Educational Feedback
                                </CardTitle>
                            </div>
                            <CardDescription>
                                {socraticFeedback?.title}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="relative">
                            <div className="absolute top-0 right-4 z-10">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-transparent">
                                            <Maximize2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                            <span className="sr-only">Expand</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2">
                                                <Lightbulb className="h-5 w-5 text-blue-500" />
                                                {socraticFeedback?.title}
                                            </DialogTitle>
                                            <DialogDescription>Detailed Feedback Review</DialogDescription>
                                        </DialogHeader>
                                        <div className="flex-1 overflow-y-auto p-1">
                                            <div className="prose dark:prose-invert max-w-none">
                                                <ReactMarkdown>
                                                    {socraticFeedback?.content || ''}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="h-[280px] overflow-y-auto pr-2">
                                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                                    <ReactMarkdown>
                                        {socraticFeedback?.content || ''}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 3. Test Case Results (Mocked) */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Code2 className="h-5 w-5" />
                                Test Cases
                            </CardTitle>
                            <CardDescription>
                                {passedTests} / {totalTests} passed ({passPercentage}%)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Progress value={passPercentage} className={`h-2 ${passPercentage === 100 ? 'bg-green-100' : ''}`} />
                            <div className="space-y-3 pt-2">
                                {testResults?.cases.map((t) => (
                                    <div key={t.id} className="flex items-start gap-3 text-sm p-2 rounded hover:bg-muted/50 transition-colors">
                                        {t.status === 'pass' ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                        )}
                                        <div className="space-y-1">
                                            <div className="font-medium leading-none">{t.name}</div>
                                            {t.message && (
                                                <p className="text-xs text-red-500">{t.message}</p>
                                            )}
                                            <div className="text-[10px] text-muted-foreground">{t.duration}ms</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Disclaimer for Sandbox */}
            <div className="bg-muted/30 p-4 rounded-lg flex items-start gap-3 border border-muted">
                <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold">About Learning Sandbox</h4>
                    <p className="text-sm text-muted-foreground">
                        Entering the sandbox allows you to experiment with your code based on the feedback above.
                        Changes made in the sandbox are for learning purposes and will <b>not</b> affect your submitted grade.
                    </p>
                </div>
            </div>
        </div>
    )
}
