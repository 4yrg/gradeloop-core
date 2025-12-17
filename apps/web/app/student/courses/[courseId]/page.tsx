"use client"

import * as React from "react" // Ensure React import for use
import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { motion } from "motion/react"
import { assignmentService } from "@/services/assignment.service"
import { StudentSidebar } from "@/components/sidebar/student-sidebar"
import { AssignmentsTable } from "@/components/tables/assignments-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, Calendar as CalendarIcon, FileBarChart } from "lucide-react"

export default function CourseDetailPage() {
    const params = useParams()
    const courseId = params.courseId as string

    const { data: course, isLoading: courseLoading } = useQuery({
        queryKey: ["course", courseId],
        queryFn: () => assignmentService.getCourseDetails(courseId),
    })

    const { data: assignments, isLoading: assignmentsLoading } = useQuery({
        queryKey: ["course-assignments", courseId],
        queryFn: () => assignmentService.getCourseAssignments(courseId),
    })

    if (courseLoading) {
        return (
            <div className="flex">
                <div className="hidden w-64 md:block">
                    <Skeleton className="h-screen w-full" />
                </div>
                <div className="flex-1 p-8 space-y-6">
                    <Skeleton className="h-12 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen">
            <div className="hidden w-64 md:block">
                <StudentSidebar className="fixed inset-y-0 w-64" />
            </div>

            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden absolute top-4 left-4 z-50">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 border-r-0 w-64">
                    <StudentSidebar />
                </SheetContent>
            </Sheet>

            <main className="flex-1 md:ml-64 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="container mx-auto p-4 md:p-8 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                    >
                        <h1 className="text-3xl font-bold tracking-tight text-primary">
                            {course?.code}: {course?.name}
                        </h1>
                        <p className="text-lg text-muted-foreground">{course?.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                            <span>Semester: {course?.semester}</span>
                            <span>Instructor: {course?.instructor}</span>
                        </div>
                    </motion.div>

                    <Tabs defaultValue="assignments" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-4">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="assignments">Assignments</TabsTrigger>
                            <TabsTrigger value="calendar">Calendar</TabsTrigger>
                            <TabsTrigger value="grades">Grades</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="mt-6">
                            <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                                <h2 className="text-xl font-semibold mb-4">Course Overview</h2>
                                <p>Course content and syllabus would go here...</p>
                            </div>
                        </TabsContent>

                        <TabsContent value="assignments" className="mt-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold">Course Assignments</h2>
                            </div>
                            {assignmentsLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.99 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <AssignmentsTable assignments={assignments || []} />
                                </motion.div>
                            )}
                        </TabsContent>

                        <TabsContent value="calendar" className="mt-6">
                            <div className="flex flex-col items-center justify-center p-12 border rounded-lg border-dashed text-muted-foreground">
                                <CalendarIcon className="h-10 w-10 mb-4 opacity-50" />
                                <p>Course Calendar coming soon</p>
                            </div>
                        </TabsContent>

                        <TabsContent value="grades" className="mt-6">
                            <div className="flex flex-col items-center justify-center p-12 border rounded-lg border-dashed text-muted-foreground">
                                <FileBarChart className="h-10 w-10 mb-4 opacity-50" />
                                <p>Gradebook visualization coming soon</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    )
}
