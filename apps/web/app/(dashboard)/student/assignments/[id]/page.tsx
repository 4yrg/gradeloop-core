"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { StudentService } from "@/services/student.service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Clock, TriangleAlert, Code, CheckCircle, FileText, BarChart3, Bot, History } from "lucide-react"

export default function AssignmentDetailPage() {
    const params = useParams()
    const router = useRouter()
    const assignmentId = params.id as string

    const { data: assignment, isLoading } = useQuery({
        queryKey: ['assignment', assignmentId],
        queryFn: () => StudentService.getAssignmentDetails(assignmentId)
    })

    // Mock specific assignment details that might not be in the list view
    const assignmentDetails = {
        ...assignment,
        rubric: [
            { criteria: "Correctness", points: 50 },
            { criteria: "Code Quality", points: 20 },
            { criteria: "Documentation", points: 10 },
            { criteria: "Performance", points: 20 },
        ],
        constraints: ["Java 17", "No external libraries", "Max runtime 2s"]
    }

    const handleStart = () => {
        router.push(`/ide/${assignmentId}`)
    }

    const status = assignment?.status || 'open' // Mock status

    if (isLoading) return <div className="p-8">Loading...</div>

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">Assignment</Badge>
                            <Badge variant={status === 'open' ? 'default' : 'secondary'}>{status.toUpperCase()}</Badge>
                        </div>
                        <h1 className="text-3xl font-bold">{assignmentDetails.title}</h1>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400 px-3 py-1 rounded-full text-sm font-medium">
                            <Clock className="h-4 w-4" />
                            <span>Due {assignmentDetails.dueDate ? new Date(assignmentDetails.dueDate).toLocaleDateString() : 'TBD'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Problem Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="leading-7 whitespace-pre-line">{assignmentDetails.description}</p>
                            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                                <h4 className="font-semibold mb-2 flex items-center gap-2"><FileText className="h-4 w-4" /> Constraints</h4>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                    {assignmentDetails.constraints.map(c => <li key={c}>{c}</li>)}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Report Section (Visible if submitted or drafts checked) */}
                    <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/20 dark:bg-blue-900/10">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" /> Analysis Reports
                            </CardTitle>
                            <CardDescription>CIPAS & AI Detection Results</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 rounded-lg bg-background border flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        <CheckCircle className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Plagiarism Check</p>
                                        <p className="text-xs text-muted-foreground">Passed (12% sim)</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm">View Report</Button>
                            </div>
                            <div className="p-4 rounded-lg bg-background border flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium">AI Probability</p>
                                        <p className="text-xs text-muted-foreground">Low (5%)</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm">View Report</Button>
                            </div>
                        </CardContent>
                    </Card>

                    {status === 'closed' && ( // Or graded
                        <Card>
                            <CardHeader>
                                <CardTitle>Instructor Feedback</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose dark:prose-invert">
                                    <p>Good implementation of the fibonacci logic. Consider optimizing the recursive approach using memoization.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Action Card */}
                    <Card className="border-primary/20 shadow-lg shadow-primary/5">
                        <CardHeader>
                            <CardTitle>Submission</CardTitle>
                            <CardDescription>
                                {status === 'open' ? 'Ready to work?' : 'Assignment Submitted'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {status === 'open' ? (
                                <Alert className="mb-4">
                                    <TriangleAlert className="h-4 w-4" />
                                    <AlertTitle>Plagiarism Warning</AlertTitle>
                                    <AlertDescription className="text-xs">
                                        Type 1-4 clone detection active.
                                    </AlertDescription>
                                </Alert>
                            ) : null}

                            <div className="space-y-3">
                                <Button onClick={handleStart} className="w-full" size="lg" variant={status === 'open' ? 'default' : 'secondary'}>
                                    <Code className="mr-2 h-4 w-4" />
                                    {status === 'open' ? 'Launch GradeLoop IDE' : 'View Code / Edit'}
                                </Button>
                                {status === 'open' && (
                                    <p className="text-xs text-center text-muted-foreground">Auto-saves every 30s</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rubric Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Grading Rubric</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {assignmentDetails.rubric.map(r => (
                                <div key={r.criteria} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 border-border">
                                    <span>{r.criteria}</span>
                                    <Badge variant="outline">{r.points} pts</Badge>
                                </div>
                            ))}
                            <div className="pt-2 flex justify-between font-bold border-t">
                                <span>Total</span>
                                <span>100 pts</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Submission History</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <div className="flex justify-between text-muted-foreground">
                                <span>v1.0 - Draft</span>
                                <span>2 mins ago</span>
                            </div>
                            {status !== 'open' && (
                                <div className="flex justify-between font-medium">
                                    <span>v2.0 - Final</span>
                                    <span>1 min ago</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
