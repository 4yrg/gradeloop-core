"use client"

import { useUserStore } from "@/store/useUserStore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CalendarDays, Clock, BookOpen, Bell, MessageSquare, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { StudentService } from "@/services/student.service"

export default function StudentDashboard() {
    const { user } = useUserStore()

    const { data: courses, isLoading: coursesLoading } = useQuery({
        queryKey: ['student-courses'],
        queryFn: StudentService.getEnrolledCourses
    })

    const { data: upcomingAssignments, isLoading: assignmentsLoading } = useQuery({
        queryKey: ['student-upcoming-assignments'],
        queryFn: StudentService.getUpcomingAssignments
    })

    const { data: announcements, isLoading: announcementsLoading } = useQuery({
        queryKey: ['student-announcements'],
        queryFn: StudentService.getAnnouncements
    })

    const { data: gradedAssignments, isLoading: gradedLoading } = useQuery({
        queryKey: ['student-graded-assignments'],
        queryFn: StudentService.getGradedAssignments
    })

    const notices = [
        { id: 1, from: "Dr. Smith", subject: "Assignment 1 Extended", date: "Today" },
        { id: 2, from: "Admin", subject: "Profile Update Required", date: "Yesterday" }
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome back, {user?.name || "Student"}! Here's what's happening.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/student/calendar">
                            <CalendarDays className="mr-2 h-4 w-4" /> Calendar
                        </Link>
                    </Button>
                    <Button variant="default" size="sm">
                        <BookOpen className="mr-2 h-4 w-4" /> Go to LMS
                    </Button>
                </div>
            </div>

            {/* Top Stats/Widgets */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
                        <BookOpen className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{coursesLoading ? "..." : courses?.length}</div>
                        <p className="text-xs text-muted-foreground">Active this semester</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                        <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{assignmentsLoading ? "..." : upcomingAssignments?.length}</div>
                        <p className="text-xs text-muted-foreground">Due this week</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Messages</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2</div>
                        <p className="text-xs text-muted-foreground">Unread messages</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Good</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">85%</div>
                        <p className="text-xs text-muted-foreground">Based on submitted work</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 md:grid-cols-7 lg:grid-cols-7">
                {/* Main Content Area: Assignments & Courses */}
                <div className="md:col-span-4 lg:col-span-5 space-y-8">

                    {/* Active Assignments */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold tracking-tight">Upcoming Deadlines</h2>
                            <Link href="/student/assignments" className="text-sm text-primary hover:underline">View all</Link>
                        </div>
                        {assignmentsLoading ? (
                            <div className="h-20 bg-muted animate-pulse rounded-lg" />
                        ) : (
                            <div className="grid gap-4">
                                {upcomingAssignments?.map(a => (
                                    <div key={a.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-primary/10 rounded-full">
                                                <Clock className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium">{a.title}</h4>
                                                <p className="text-sm text-muted-foreground">Course ID: {a.courseId}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-destructive">Due {new Date(a.dueDate).toLocaleDateString()}</p>
                                            <Button size="sm" variant="link" asChild className="px-0 h-auto">
                                                <Link href={`/student/assignments/${a.id}`}>Open Assignment</Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {upcomingAssignments?.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">No upcoming assignments.</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Graded Assignments */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold tracking-tight">Recent Grades</h2>
                        </div>
                        {gradedLoading ? (
                            <div className="h-20 bg-muted animate-pulse rounded-lg" />
                        ) : (
                            <div className="grid gap-4">
                                {gradedAssignments?.map(a => (
                                    <div key={a.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-green-500/10 rounded-full">
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium">{a.title}</h4>
                                                <p className="text-sm text-muted-foreground">Course ID: {a.courseId}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="secondary" className="mb-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Graded</Badge>
                                            <div>
                                                <Button size="sm" variant="link" asChild className="px-0 h-auto">
                                                    <Link href={`/student/graded/${a.id}`}>View Results</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {gradedAssignments?.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">No graded assignments yet.</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* My Courses Grid */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold tracking-tight">My Courses</h2>
                            <Link href="/student/courses" className="text-sm text-primary hover:underline">View all</Link>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {courses?.map(course => (
                                <Link key={course.id} href={`/student/courses/${course.id}`}>
                                    <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <Badge variant="outline">{course.code}</Badge>
                                                <Badge>{course.semester}</Badge>
                                            </div>
                                            <CardTitle className="mt-2 text-lg line-clamp-1">{course.name}</CardTitle>
                                            <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm text-muted-foreground">
                                                    <span>Completion</span>
                                                    <span>{course.progress}%</span>
                                                </div>
                                                <Progress value={course.progress} className="h-2" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Widget Area */}
                <div className="md:col-span-3 lg:col-span-2 space-y-6">
                    {/* Announcements Widget */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Bell className="h-4 w-4" /> Announcements
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {announcementsLoading ? (
                                <div className="space-y-4">
                                    <div className="h-12 bg-muted animate-pulse rounded" />
                                    <div className="h-12 bg-muted animate-pulse rounded" />
                                </div>
                            ) : announcements?.map(ann => (
                                <div key={ann.id} className="border-l-2 border-primary pl-3 space-y-1">
                                    <p className="text-sm font-medium leading-none">{ann.title}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{ann.content}</p>
                                    <p className="text-[10px] text-muted-foreground pt-1">{new Date(ann.date).toLocaleDateString()}</p>
                                </div>
                            ))}
                            <Button variant="ghost" size="sm" className="w-full text-xs">View All Announcements</Button>
                        </CardContent>
                    </Card>

                    {/* Messages/Notices Widget */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" /> Messages
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {notices.map(notice => (
                                <div key={notice.id} className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{notice.subject}</p>
                                        <p className="text-xs text-muted-foreground">From: {notice.from}</p>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">{notice.date}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
