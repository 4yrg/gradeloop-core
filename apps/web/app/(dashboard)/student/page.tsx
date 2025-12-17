"use client"

import { useUserStore } from "@/store/useUserStore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CalendarDays, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function StudentDashboard() {
    const { user } = useUserStore()

    // Mock Data
    const assignments = [
        { id: 1, course: "CS101", title: "Data Structures Basics", due: "2 days left", progress: 0 },
        { id: 2, course: "SE202", title: "React Component Design", due: "5 days left", progress: 30 },
    ]

    const recentFeedback = [
        { id: 101, title: "Algorithm Analysis Report", score: 88, status: "Graded" },
        { id: 102, title: "Database Schema v1", score: 92, status: "Graded" },
    ]

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name?.split(" ")[0]}!</h1>
                <p className="text-muted-foreground">
                    You have 2 pending assignments due this week.
                </p>
            </div>

            {/* Overview Widgets */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4</div>
                        <p className="text-xs text-muted-foreground">2 High Priority</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">85%</div>
                        <p className="text-xs text-muted-foreground">+2.5% from last month</p>
                    </CardContent>
                </Card>
            </div>

            {/* Active Assignments */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Active Assignments</h2>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/student/assignments">View all <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {assignments.map(a => (
                        <Card key={a.id} className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline">{a.course}</Badge>
                                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">{a.due}</Badge>
                                </div>
                                <CardTitle className="mt-2 text-lg">{a.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Progress</span>
                                        <span>{a.progress}%</span>
                                    </div>
                                    <Progress value={a.progress} className="h-2" />
                                    <div className="pt-4">
                                        <Button className="w-full">Continue Coding</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Recent Feedback & Course Progress */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Feedback</CardTitle>
                        <CardDescription>Your latest graded submissions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {recentFeedback.map(f => (
                            <div key={f.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                                <div>
                                    <p className="font-medium">{f.title}</p>
                                    <p className="text-xs text-muted-foreground">Released 2 days ago</p>
                                </div>
                                <Badge variant="default" className="bg-green-600">{f.score}/100</Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Course Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">CS101 - Intro to CS</span>
                                <span className="text-muted-foreground">8/12 Modules</span>
                            </div>
                            <Progress value={66} />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">SE202 - Software Eng</span>
                                <span className="text-muted-foreground">4/10 Modules</span>
                            </div>
                            <Progress value={40} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
