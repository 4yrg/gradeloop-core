"use client"

import { useQuery } from "@tanstack/react-query"
import { InstructorService } from "@/services/instructor.service"
import { useUserStore } from "@/store/useUserStore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Users, FileText, TriangleAlert, MessageSquare, TrendingUp, MoreHorizontal, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function InstructorDashboard() {
    const { user } = useUserStore()

    const { data: courses, isLoading } = useQuery({
        queryKey: ['instructor-courses'],
        queryFn: InstructorService.getCourses
    })

    // Mock specific stats
    const stats = [
        { label: "Active Students", value: "142", icon: Users, color: "text-blue-500" },
        { label: "Pending Reviews", value: "18", icon: FileText, color: "text-orange-500" },
        { label: "Plagiarism Alerts", value: "3", icon: TriangleAlert, color: "text-red-500" },
        { label: "Unread Messages", value: "5", icon: MessageSquare, color: "text-purple-500" },
    ]

    const submissions = [
        { id: 1, student: "Alice Cooper", assignment: "Lab 2: Loops", status: "Submitted", time: "10 mins ago" },
        { id: 2, student: "Bob Smith", assignment: "Lab 2: Loops", status: "Late", time: "1 hour ago" },
        { id: 3, student: "Charlie Day", assignment: "Project 1", status: "Flagged", time: "2 hours ago" },
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Instructor Dashboard</h1>
                    <p className="text-muted-foreground">Manage your courses and assess student performance.</p>
                </div>
                <Button>Create New Course</Button>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                {/* Course List */}
                <Card className="col-span-4 lg:col-span-4">
                    <CardHeader>
                        <CardTitle>My Courses</CardTitle>
                        <CardDescription>Courses you are currently teaching.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isLoading ? (
                            <div className="space-y-4">
                                <div className="h-16 w-full bg-muted animate-pulse rounded-lg" />
                                <div className="h-16 w-full bg-muted animate-pulse rounded-lg" />
                            </div>
                        ) : (
                            courses?.map(course => (
                                <div key={course.id} className="flex items-center justify-between border p-4 rounded-lg bg-card/50 hover:bg-card transition-colors">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold">{course.name}</h4>
                                            <Badge variant="outline">{course.code}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{course.semester} - {course.enrolledCount} Students</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="hidden md:block text-right">
                                            <div className="text-sm font-medium">Progress</div>
                                            <Progress value={course.progress} className="w-24 h-2 mt-1" />
                                        </div>
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/instructor/courses/${course.id}`}>
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Recent Submissions */}
                <Card className="col-span-3 lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest submissions needing attention.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {submissions.map(sub => (
                                <div key={sub.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                {sub.student[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium leading-none">{sub.student}</p>
                                            <p className="text-xs text-muted-foreground">{sub.assignment}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <Badge variant={sub.status === 'Flagged' ? "destructive" : sub.status === 'Late' ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0.5 h-auto">
                                            {sub.status}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground">{sub.time}</span>
                                    </div>
                                </div>
                            ))}
                            <Button variant="ghost" size="sm" className="w-full text-xs">View All Activity</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
