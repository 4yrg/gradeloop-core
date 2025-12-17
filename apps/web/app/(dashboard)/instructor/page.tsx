"use client"

import { useQuery } from "@tanstack/react-query"
import { InstructorService } from "@/services/instructor.service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Users,
    FileText,
    AlertTriangle,
    CheckCircle2,
    Calendar,
    Bell,
    TrendingUp,
    Clock
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export default function InstructorDashboard() {
    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ['instructor-dashboard-summary'],
        queryFn: InstructorService.getDashboardSummary
    })

    const { data: notifications } = useQuery({
        queryKey: ['instructor-notifications'],
        queryFn: InstructorService.getNotifications
    })

    const { data: upcomingEvents } = useQuery({
        queryKey: ['instructor-upcoming-events'],
        queryFn: InstructorService.getUpcomingEvents
    })

    const summaryCards = [
        {
            title: "Active Classes",
            value: summary?.activeClasses || 0,
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-50 dark:bg-blue-900/20",
            link: "/instructor/classes"
        },
        {
            title: "Pending Submissions",
            value: summary?.pendingSubmissions || 0,
            icon: FileText,
            color: "text-orange-600",
            bgColor: "bg-orange-50 dark:bg-orange-900/20",
            link: "/instructor/assignments"
        },
        {
            title: "Flagged Cases",
            value: summary?.flaggedCases || 0,
            icon: AlertTriangle,
            color: "text-red-600",
            bgColor: "bg-red-50 dark:bg-red-900/20",
            link: "/instructor/cipas"
        },
        {
            title: "Requiring Review",
            value: summary?.assignmentsRequiringReview || 0,
            icon: CheckCircle2,
            color: "text-green-600",
            bgColor: "bg-green-50 dark:bg-green-900/20",
            link: "/instructor/acafs"
        }
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, Dr. John Smith</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {summaryCards.map((card) => (
                    <Link key={card.title} href={card.link}>
                        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {card.title}
                                </CardTitle>
                                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                                    <card.icon className={`h-5 w-5 ${card.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {summaryLoading ? (
                                    <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                                ) : (
                                    <div className="text-3xl font-bold">{card.value}</div>
                                )}
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Teaching Timeline */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Teaching Timeline
                                </CardTitle>
                                <CardDescription>Upcoming deadlines and events</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/instructor/analytics">View All</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {upcomingEvents?.map((event: any) => (
                                <div key={event.id} className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                    <div className="p-2 rounded-full bg-primary/10">
                                        <Clock className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{event.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <Badge variant={event.type === 'deadline' ? 'destructive' : 'secondary'}>
                                        {event.type}
                                    </Badge>
                                </div>
                            ))}
                            {(!upcomingEvents || upcomingEvents.length === 0) && (
                                <p className="text-center text-muted-foreground py-8">No upcoming events</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications Panel */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Notifications
                        </CardTitle>
                        <CardDescription>Recent activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {notifications?.map((notif: any) => (
                                <Link key={notif.id} href={notif.link}>
                                    <div className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                                        <div className="flex items-start gap-2">
                                            <div className={`mt-0.5 h-2 w-2 rounded-full ${notif.type === 'plagiarism' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{notif.message}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            {(!notifications || notifications.length === 0) && (
                                <p className="text-center text-muted-foreground py-8 text-sm">No new notifications</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Button variant="outline" className="h-auto flex-col gap-2 p-6" asChild>
                            <Link href="/instructor/assignments/create">
                                <FileText className="h-6 w-6" />
                                <span>Create Assignment</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-auto flex-col gap-2 p-6" asChild>
                            <Link href="/instructor/classes">
                                <Users className="h-6 w-6" />
                                <span>Manage Classes</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-auto flex-col gap-2 p-6" asChild>
                            <Link href="/instructor/analytics">
                                <TrendingUp className="h-6 w-6" />
                                <span>View Analytics</span>
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
