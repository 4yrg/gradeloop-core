"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { StudentService } from "@/services/student.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, MinusCircle } from "lucide-react"

export default function CourseGradesPage() {
    const { id } = useParams()
    const courseId = id as string

    // In a real app, use a specific endpoint. Here we join assignments with submissions.
    const { data: assignments } = useQuery({
        queryKey: ['course-assignments', courseId],
        queryFn: () => StudentService.getCourseAssignments(courseId)
    })

    // Mock submissions fetch - in reality, service method needed
    // Assuming we have access to MOCK_SUBMISSIONS via some service or just mocking for UI
    const mockGrades = [
        { assignmentId: 'a1', grade: 85, feedback: 'Good work', status: 'graded', submittedAt: new Date().toISOString() },
        { assignmentId: 'a2', grade: null, status: 'pending', submittedAt: new Date().toISOString() }
    ]

    const getSubmission = (assignmentId: string) => {
        // Mock lookup
        return mockGrades.find(g => g.assignmentId === assignmentId)
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Grades</h2>
                <p className="text-muted-foreground">View your grades and feedback.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Gradebook</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">Item</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Feedback</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assignments?.map(a => {
                                const sub = getSubmission(a.id)
                                return (
                                    <TableRow key={a.id}>
                                        <TableCell className="font-medium">{a.title}</TableCell>
                                        <TableCell>
                                            {sub ? (
                                                <Badge variant={sub.status === 'graded' ? 'default' : 'secondary'}>
                                                    {sub.status.toUpperCase()}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">MISSING</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {sub?.grade ? (
                                                <span className="font-bold text-green-600 dark:text-green-400">{sub.grade} / {a.points}</span>
                                            ) : (
                                                <span className="text-muted-foreground">- / {a.points}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {sub?.feedback || "-"}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
