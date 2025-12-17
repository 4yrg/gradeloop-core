"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { InstructorService } from "@/services/instructor.service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { FileText, Calendar, Users, CheckCircle2, Clock, Edit, Trash2, Eye, Code } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useState } from "react"

export default function AssignmentDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const assignmentId = id as string
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    const { data: assignment } = useQuery({
        queryKey: ['assignment-detail', assignmentId],
        queryFn: () => InstructorService.getAssignmentDetail(assignmentId)
    })

    const { data: submissions } = useQuery({
        queryKey: ['assignment-submissions', assignmentId],
        queryFn: () => InstructorService.getAssignmentSubmissions(assignmentId)
    })

    const handleDelete = async () => {
        try {
            await InstructorService.deleteAssignment(assignmentId)
            toast.success("Assignment deleted successfully")
            router.push("/instructor/assignments")
        } catch (error) {
            toast.error("Failed to delete assignment")
        }
    }

    if (!assignment) {
        return <div className="p-8">Loading...</div>
    }

    const submittedCount = submissions?.filter((s: any) => s.status !== 'NOT_SUBMITTED').length || 0
    const totalStudents = assignment.totalStudents || 0
    const submissionRate = totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{assignment.title}</h1>
                    <p className="text-muted-foreground mt-2">{assignment.description}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/instructor/assignments/${assignmentId}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete this assignment and all associated submissions.
                                    This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                                    Delete Assignment
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Students
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalStudents}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Submitted
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">{submittedCount}</div>
                        <Progress value={submissionRate} className="mt-2 h-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Pending
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-600">
                            {submissions?.filter((s: any) => s.status === 'SUBMITTED').length || 0}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Graded
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">
                            {submissions?.filter((s: any) => s.status === 'GRADED').length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="submissions">
                <TabsList>
                    <TabsTrigger value="submissions">Submissions</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="rubric">Rubric</TabsTrigger>
                    <TabsTrigger value="tests">Test Cases</TabsTrigger>
                </TabsList>

                {/* Submissions Tab */}
                <TabsContent value="submissions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Student Submissions</CardTitle>
                            <CardDescription>View and grade all submissions for this assignment</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {submissions?.map((submission: any) => (
                                    <div key={submission.id} className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <p className="font-medium">{submission.student?.name}</p>
                                                <Badge variant={
                                                    submission.status === 'GRADED' ? 'default' :
                                                        submission.status === 'SUBMITTED' ? 'secondary' : 'outline'
                                                }>
                                                    {submission.status}
                                                </Badge>
                                                {submission.grade && (
                                                    <Badge variant="outline">{submission.grade}%</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {submission.submittedAt ? (
                                                    <>Submitted: {new Date(submission.submittedAt).toLocaleString()}</>
                                                ) : (
                                                    'Not submitted'
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            {submission.status !== 'NOT_SUBMITTED' && (
                                                <>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/instructor/submissions/${submission.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Review
                                                        </Link>
                                                    </Button>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/instructor/ide/${submission.id}`}>
                                                            <Code className="mr-2 h-4 w-4" />
                                                            IDE
                                                        </Link>
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {(!submissions || submissions.length === 0) && (
                                    <div className="text-center py-12 border rounded-lg bg-muted/10">
                                        <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                        <p className="text-muted-foreground">No submissions yet</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Assignment Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Course</p>
                                    <p className="font-medium">{assignment.course?.code} - {assignment.course?.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Due Date</p>
                                    <p className="font-medium">{new Date(assignment.dueDate).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Language</p>
                                    <p className="font-medium">{assignment.language}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Time Limit</p>
                                    <p className="font-medium">{assignment.timeLimit}ms</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-2">Features Enabled</p>
                                <div className="flex gap-2">
                                    {assignment.aiAssistanceEnabled && <Badge>AI Assistance</Badge>}
                                    {assignment.cipasEnabled && <Badge>CIPAS Detection</Badge>}
                                    {assignment.allowResubmissions && <Badge>Resubmissions ({assignment.maxResubmissions})</Badge>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Rubric Tab */}
                <TabsContent value="rubric" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Grading Rubric</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {assignment.rubric?.map((criterion: any, idx: number) => (
                                    <div key={idx} className="p-4 rounded-lg border">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-medium">{criterion.name}</p>
                                                <p className="text-sm text-muted-foreground">{criterion.description}</p>
                                            </div>
                                            <Badge variant="outline">{criterion.weight}%</Badge>
                                        </div>
                                        {criterion.autoGrade && (
                                            <Badge variant="secondary" className="text-xs">Auto-graded</Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Test Cases Tab */}
                <TabsContent value="tests" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Test Cases</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {assignment.testCases?.map((test: any, idx: number) => (
                                    <div key={idx} className="p-4 rounded-lg border">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-medium">Test Case {idx + 1}</p>
                                            <div className="flex gap-2">
                                                <Badge variant={test.hidden ? 'secondary' : 'outline'}>
                                                    {test.hidden ? 'Hidden' : 'Visible'}
                                                </Badge>
                                                <Badge variant="outline">{test.points} pts</Badge>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-3">
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Input</p>
                                                <pre className="text-xs bg-muted p-2 rounded">{test.input}</pre>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Expected Output</p>
                                                <pre className="text-xs bg-muted p-2 rounded">{test.expectedOutput}</pre>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
