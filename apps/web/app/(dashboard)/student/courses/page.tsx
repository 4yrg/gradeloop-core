"use client"

import { useQuery } from "@tanstack/react-query"
import { StudentService } from "@/services/student.service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, User } from "lucide-react"
import Link from "next/link"

export default function StudentCoursesPage() {
    const { data: courses, isLoading } = useQuery({
        queryKey: ['student-courses'],
        queryFn: StudentService.getEnrolledCourses
    })

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
                <p className="text-muted-foreground">Manage your enrolled courses and track progress.</p>
            </div>

            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-muted animate-pulse rounded-lg border" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {courses?.map(course => (
                        <Card key={course.id} className="flex flex-col hover:border-primary/50 transition-colors">
                            <div className="h-32 w-full bg-muted relative overflow-hidden rounded-t-lg">
                                {course.thumbnail ? (
                                    <img src={course.thumbnail} alt={course.name} className="object-cover w-full h-full" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                        <BookOpen className="h-10 w-10 text-muted-foreground/50" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">{course.semester}</Badge>
                                </div>
                            </div>
                            <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="outline">{course.code}</Badge>
                                </div>
                                <CardTitle className="line-clamp-1">{course.name}</CardTitle>
                                <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <User className="h-4 w-4" />
                                        <span>Dr. Instructor</span> {/* Mock instructor name lookup if needed */}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Progress</span>
                                            <span>{course.progress}%</span>
                                        </div>
                                        <Progress value={course.progress} className="h-2" />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0">
                                <Button className="w-full" asChild>
                                    <Link href={`/student/courses/${course.id}`}>View Course</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
