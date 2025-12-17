"use client"

import { useParams, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { StudentService } from "@/services/student.service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Clock, FileText } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

export default function CourseAssignmentsPage() {
    const { id } = useParams()
    const courseId = id as string
    const searchParams = useSearchParams()

    const { data: assignments, isLoading } = useQuery({
        queryKey: ['course-assignments', courseId],
        queryFn: () => StudentService.getCourseAssignments(courseId)
    })

    // Show success toast if redirected after submission
    useEffect(() => {
        if (searchParams.get('submitted') === 'true') {
            toast.success("Assignment Submitted! 🎉", {
                description: "Your submission has been received and will be graded soon.",
            })
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname)
        }
    }, [searchParams])

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Assignments</h2>
                <p className="text-muted-foreground">Manage your coursework and submissions.</p>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <div className="h-24 bg-muted animate-pulse rounded-lg border" />
                    <div className="h-24 bg-muted animate-pulse rounded-lg border" />
                </div>
            ) : (
                <div className="grid gap-4">
                    {assignments?.map(a => (
                        <Card key={a.id} className="flex flex-col md:flex-row md:items-center justify-between p-6">
                            <div className="space-y-2 mb-4 md:mb-0 max-w-2xl">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-semibold text-lg">{a.title}</h3>
                                    <Badge variant={a.status === 'open' ? 'default' : 'secondary'}>
                                        {a.status.toUpperCase()}
                                    </Badge>
                                    <Badge variant="outline">{a.type}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{a.description}</p>
                                <div className="flex items-center gap-6 text-sm text-muted-foreground pt-1">
                                    <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Due: {new Date(a.dueDate).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1.5"><FileText className="h-4 w-4" /> {a.points} Points</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {a.status === 'open' && (
                                    <Button asChild>
                                        <Link href={`/student/assignments/${a.id}`}>View & Submit</Link>
                                    </Button>
                                )}
                                {a.status === 'closed' && (
                                    <Button variant="secondary" asChild>
                                        <Link href={`/student/assignments/${a.id}`}>View Submission</Link>
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                    {assignments?.length === 0 && (
                        <div className="text-center py-12 border rounded-lg bg-muted/10">
                            <p className="text-muted-foreground">No assignments found for this course.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
