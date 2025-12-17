"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ArrowRight, Clock } from "lucide-react"
import Link from "next/link"
import { Course } from "@/store/course.store"

interface MyCoursesWidgetProps {
    courses: Course[]
}

export function MyCoursesWidget({ courses }: MyCoursesWidgetProps) {
    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader>
                <CardTitle>My Courses</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {courses.map((course) => (
                    <div
                        key={course.id}
                        className="flex flex-col space-y-3 rounded-lg border p-4 shadow-sm transition-colors hover:bg-muted/50"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-semibold">{course.name}</h3>
                                <p className="text-sm text-muted-foreground">{course.code}</p>
                            </div>
                            <Badge variant="outline">{course.semester}</Badge>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Progress</span>
                                <span>{course.progress}%</span>
                            </div>
                            <Progress value={course.progress} className="h-2" />
                        </div>

                        {course.nextDeadline && (
                            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-500">
                                <Clock className="h-3 w-3" />
                                <span>Next: {course.nextDeadline.title}</span>
                            </div>
                        )}

                        <Button asChild variant="ghost" size="sm" className="w-full justify-between">
                            <Link href={`/student/courses/${course.id}`}>
                                View Course <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
