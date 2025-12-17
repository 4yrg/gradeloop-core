"use client"

import { useUserStore } from "@/store/useUserStore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, FileText, TriangleAlert, MessageSquare, TrendingUp } from "lucide-react"

export default function InstructorDashboard() {
    const { user } = useUserStore()

    // Mock Data
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
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Instructor Dashboard</h1>
                <p className="text-muted-foreground">Manage your courses and assess student performance.</p>
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Submissions */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Submissions</CardTitle>
                        <CardDescription>Latest student activity across all courses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {submissions.map(sub => (
                                <div key={sub.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-4">
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
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-muted-foreground">{sub.time}</span>
                                        <Badge variant={sub.status === 'Flagged' ? "destructive" : sub.status === 'Late' ? "secondary" : "outline"} className={sub.status === 'Submitted' ? "text-green-600 bg-green-50 hover:bg-green-100 border-green-200" : ""}>
                                            {sub.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Grade Distribution or Quick Actions */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Performance Trends</CardTitle>
                        <CardDescription>Average scores over time</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[200px]">
                        <div className="flex flex-col items-center text-muted-foreground">
                            <TrendingUp className="h-10 w-10 mb-2 opacity-50" />
                            <p>Chart Visualization Placeholder</p>
                            <p className="text-xs">(Recharts integration)</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
