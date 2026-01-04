"use client";

import { use } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Users,
    CheckCircle2,
    Clock,
    TrendingUp,
    AlertTriangle,
    Settings,
    BookOpen,
    BarChart3,
    Eye,
    PlayCircle,
    UserCheck,
    UserX,
    Timer,
    Target,
    ChevronRight,
    Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";

// Mock data for the dashboard
const mockDashboardData = {
    statusOverview: {
        totalStudents: 45,
        vivasCompleted: 32,
        vivasInProgress: 5,
        vivasNotStarted: 8,
        averageScore: 78,
        averageDuration: 12.5
    },
    quickStats: {
        passRate: 87,
        competencyDistribution: {
            novice: 15,
            intermediate: 45,
            advanced: 35,
            expert: 5
        },
        commonMisconceptions: [
            "Time complexity confusion",
            "Memory management concepts",
            "Algorithm correctness"
        ],
        flaggedSessions: 3
    },
    configuration: {
        enabled: true,
        rubricStatus: "configured",
        questionBankStatus: "ready",
        triggerSettings: "manual"
    },
    recentActivity: [
        {
            studentName: "Alice Johnson",
            score: 92,
            duration: 14,
            status: "completed",
            timeAgo: "2 hours ago"
        },
        {
            studentName: "Bob Smith",
            score: 76,
            duration: 11,
            status: "completed",
            timeAgo: "4 hours ago"
        },
        {
            studentName: "Carol Davis",
            score: null,
            duration: null,
            status: "in_progress",
            timeAgo: "6 hours ago"
        },
        {
            studentName: "David Wilson",
            score: 85,
            duration: 13,
            status: "completed",
            timeAgo: "1 day ago"
        }
    ]
};

function StatusOverview({ data }: { data: typeof mockDashboardData.statusOverview }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                            <p className="text-2xl font-bold">{data.totalStudents}</p>
                        </div>
                        <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Completed</p>
                            <p className="text-2xl font-bold text-green-600">{data.vivasCompleted}</p>
                            <p className="text-xs text-muted-foreground">
                                {Math.round((data.vivasCompleted / data.totalStudents) * 100)}% of total
                            </p>
                        </div>
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                            <p className="text-2xl font-bold">{data.averageScore}/100</p>
                            <p className="text-xs text-muted-foreground">Across all students</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                            <p className="text-2xl font-bold">{data.averageDuration}min</p>
                            <p className="text-xs text-muted-foreground">Per session</p>
                        </div>
                        <Clock className="h-8 w-8 text-orange-600" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function QuickStatsCards({ data }: { data: typeof mockDashboardData.quickStats }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Pass Rate</p>
                            <p className="text-2xl font-bold text-green-600">{data.passRate}%</p>
                        </div>
                        <Target className="h-8 w-8 text-green-600" />
                    </div>
                    <Progress value={data.passRate} className="h-2" />
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-4">Competency Levels</p>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>Novice</span>
                                <span>{data.competencyDistribution.novice}%</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span>Intermediate</span>
                                <span>{data.competencyDistribution.intermediate}%</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span>Advanced</span>
                                <span>{data.competencyDistribution.advanced}%</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span>Expert</span>
                                <span>{data.competencyDistribution.expert}%</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Common Issues</p>
                            <p className="text-sm font-medium">Top misconceptions:</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <ul className="text-xs space-y-1">
                        {data.commonMisconceptions.map((issue, index) => (
                            <li key={index} className="flex items-center gap-1">
                                <div className="w-1 h-1 bg-red-600 rounded-full" />
                                {issue}
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Flagged Sessions</p>
                            <p className="text-2xl font-bold text-orange-600">{data.flaggedSessions}</p>
                            <p className="text-xs text-muted-foreground">Need review</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-orange-600" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function VivaConfigurationCard({ config }: { config: typeof mockDashboardData.configuration }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Viva Configuration Status
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-base">Viva Assessment Enabled</Label>
                        <p className="text-sm text-muted-foreground">Students can access viva evaluations</p>
                    </div>
                    <Switch checked={config.enabled} />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span className="text-sm font-medium">Rubric</span>
                        </div>
                        <Badge variant={config.rubricStatus === "configured" ? "default" : "destructive"}>
                            {config.rubricStatus === "configured" ? "Configured" : "Needs Setup"}
                        </Badge>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            <span className="text-sm font-medium">Question Bank</span>
                        </div>
                        <Badge variant={config.questionBankStatus === "ready" ? "default" : "secondary"}>
                            {config.questionBankStatus === "ready" ? "Ready" : "Incomplete"}
                        </Badge>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <PlayCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Trigger</span>
                        </div>
                        <Badge variant="outline">
                            {config.triggerSettings === "manual" ? "Manual" :
                             config.triggerSettings === "lab-based" ? "Lab-based" : "Deadline-based"}
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function RecentSessionsList({ sessions }: { sessions: typeof mockDashboardData.recentActivity }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {sessions.map((session, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                        {session.studentName.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium">{session.studentName}</p>
                                    <p className="text-xs text-muted-foreground">{session.timeAgo}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {session.status === "completed" ? (
                                    <>
                                        <div className="text-right">
                                            <p className="text-sm font-bold">{session.score}/100</p>
                                            <p className="text-xs text-muted-foreground">{session.duration}min</p>
                                        </div>
                                        <Badge variant="default" className="bg-green-100 text-green-800">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Completed
                                        </Badge>
                                    </>
                                ) : (
                                    <Badge variant="secondary">
                                        <Clock className="h-3 w-3 mr-1" />
                                        In Progress
                                    </Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function QuickActionsMenu({ courseId, assignmentId }: { courseId: string; assignmentId: string }) {
    const actions = [
        {
            title: "Configure Viva",
            description: "Set up assessment parameters",
            icon: Settings,
            href: `/instructor/courses/${courseId}/assignments/${assignmentId}/viva-voce/configure`,
            available: false
        },
        {
            title: "Edit Rubric",
            description: "Modify evaluation criteria",
            icon: BookOpen,
            href: `/instructor/courses/${courseId}/assignments/${assignmentId}/viva-voce/rubric`,
            available: false
        },
        {
            title: "View All Sessions",
            description: "Review student performances",
            icon: Users,
            href: `/instructor/courses/${courseId}/assignments/${assignmentId}/viva-voce/sessions`,
            available: false
        },
        {
            title: "Analytics Dashboard",
            description: "Detailed performance insights",
            icon: BarChart3,
            href: `/instructor/courses/${courseId}/assignments/${assignmentId}/viva-voce/analytics`,
            available: false
        },
        {
            title: "Live Monitoring",
            description: "Monitor active sessions",
            icon: Eye,
            href: `/instructor/courses/${courseId}/assignments/${assignmentId}/viva-voce/monitoring`,
            available: false
        }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-3">
                    {actions.map((action, index) => (
                        <Button
                            key={index}
                            variant="outline"
                            className="justify-start h-auto p-4"
                            asChild={action.available}
                            disabled={!action.available}
                        >
                            {action.available ? (
                                <Link href={action.href} className="flex items-center gap-3 w-full">
                                    <action.icon className="h-5 w-5" />
                                    <div className="text-left">
                                        <p className="font-medium">{action.title}</p>
                                        <p className="text-xs text-muted-foreground">{action.description}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 ml-auto" />
                                </Link>
                            ) : (
                                <div className="flex items-center gap-3 w-full opacity-50">
                                    <action.icon className="h-5 w-5" />
                                    <div className="text-left">
                                        <p className="font-medium">{action.title}</p>
                                        <p className="text-xs text-muted-foreground">{action.description}</p>
                                    </div>
                                    <Badge variant="secondary" className="ml-auto text-xs">
                                        Coming Soon
                                    </Badge>
                                </div>
                            )}
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default function VivaVoceDashboard({
    params
}: {
    params: Promise<{ id: string; assignmentId: string }>
}) {
    const { id: courseId, assignmentId } = use(params);

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-7xl mx-auto w-full px-4 pt-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Button variant="ghost" asChild className="w-fit -ml-2 text-muted-foreground hover:text-foreground">
                    <Link href={`/instructor/courses/${courseId}/assignments/${assignmentId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Assignment
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Viva Management Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor and manage automated viva assessments for this assignment.
                    </p>
                </div>
            </div>

            {/* Status Overview */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Status Overview</h2>
                <StatusOverview data={mockDashboardData.statusOverview} />
            </div>

            {/* Quick Stats */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
                <QuickStatsCards data={mockDashboardData.quickStats} />
            </div>

            {/* Configuration Status & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <VivaConfigurationCard config={mockDashboardData.configuration} />
                <QuickActionsMenu courseId={courseId} assignmentId={assignmentId} />
            </div>

            {/* Recent Activity */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                <RecentSessionsList sessions={mockDashboardData.recentActivity} />
            </div>
        </div>
    );
}
