"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { StudentService } from "@/services/student.service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, CheckCircle2, Circle, Clock } from "lucide-react"

export default function CourseOverviewPage() {
    const { id } = useParams()
    const courseId = id as string

    const { data: courses } = useQuery({
        queryKey: ['student-courses'],
        queryFn: StudentService.getEnrolledCourses
    })
    const course = courses?.find(c => c.id === courseId)

    // Mock Modules
    const modules = [
        { id: 1, title: "Introduction to the Course", completed: true },
        { id: 2, title: "Core Concepts - Part 1", completed: true },
        { id: 3, title: "Core Concepts - Part 2", completed: false },
        { id: 4, title: "Advanced Topics", completed: false },
        { id: 5, title: "Final Project Guidelines", completed: false },
    ]

    if (!course) return <div className="p-8">Loading course...</div>

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Course Header */}
            <div className="bg-card border rounded-lg p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{course.code}</Badge>
                            <Badge variant="secondary">{course.semester}</Badge>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">{course.name}</h1>
                        <p className="text-muted-foreground max-w-2xl">{course.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="text-sm font-medium text-muted-foreground">Instructor</div>
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="font-bold text-xs">INS</span>
                            </div>
                            <span className="font-medium">Dr. John Smith</span>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" /> {course.credits} Credits
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" /> 45 Hours
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Course Modules</CardTitle>
                            <CardDescription>Track your progress through the course materials.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {modules.map((mod, idx) => (
                                <div key={mod.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                    {mod.completed ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-muted-foreground" />
                                    )}
                                    <div className="flex-1">
                                        <p className="font-medium">Module {idx + 1}: {mod.title}</p>
                                    </div>
                                    <Button size="sm" variant="ghost">View</Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Completion Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-center py-4">
                                <div className="relative h-32 w-32 flex items-center justify-center rounded-full border-8 border-primary/20">
                                    <span className="text-3xl font-bold">{course.progress}%</span>
                                </div>
                            </div>
                            <p className="text-center text-sm text-muted-foreground">
                                You are doing great! Keep up the momentum.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
