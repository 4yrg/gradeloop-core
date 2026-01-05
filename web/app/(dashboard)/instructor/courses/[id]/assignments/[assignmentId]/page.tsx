'use client';

import { useParams } from "next/navigation";
import { mockAssignments } from "../../../../../../../lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../../../../components/ui/card";
import {
    Clock,
    Users,
    CheckCircle2,
    AlertTriangle,
    BarChart3,
    MessageSquare,
    ShieldAlert
} from "lucide-react";
import { Badge } from "../../../../../../../components/ui/badge";
import { Progress } from "../../../../../../../components/ui/progress";

export default function AssignmentOverviewPage() {
    const params = useParams();
    const { assignmentId } = params;

    const assignment = mockAssignments.find(a => a.id === assignmentId) || {
        name: "Assignment Title",
    };

    const stats = [
        { label: "Submissions", value: "84 / 120", icon: Users, trend: "+12 today" },
        { label: "Avg. Score", value: "72.4%", icon: BarChart3, trend: "Target: 75%" },
        { label: "Viva Completion", value: "65%", icon: MessageSquare, progress: 65 },
        { label: "Integrity Flags", value: "5", icon: ShieldAlert, color: "text-red-500" },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.label}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                            <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color || ""}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            {stat.trend && (
                                <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
                            )}
                            {stat.progress !== undefined && (
                                <Progress value={stat.progress} className="h-1 mt-3" />
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Assignment Timeline</CardTitle>
                        <CardDescription>Key deadlines and milestones</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { date: "Oct 20, 2025", title: "Soft Deadline", status: "Completed" },
                                { date: "Oct 25, 2025", title: "Final Submission Deadline", status: "In 2 days", active: true },
                                { date: "Oct 28, 2025", title: "Viva Completion Target", status: "Upcoming" },
                                { date: "Nov 01, 2025", title: "Grade Publication", status: "Upcoming" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${item.active ? "bg-primary animate-pulse" : "bg-muted"}`} />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{item.title}</p>
                                        <p className="text-xs text-muted-foreground">{item.date}</p>
                                    </div>
                                    <Badge variant={item.active ? "default" : "secondary"} className="text-[10px]">
                                        {item.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Health Check</CardTitle>
                        <CardDescription>System status & alerts</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-4 p-3 rounded-lg border bg-yellow-500/5 border-yellow-500/20">
                            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">5 Integrity Flags</p>
                                <p className="text-xs text-muted-foreground">Manual review required for suspicious submissions.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-3 rounded-lg border bg-green-500/5 border-green-500/20">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">Autograder Healthy</p>
                                <p className="text-xs text-muted-foreground">98% success rate in test execution.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-3 rounded-lg border bg-blue-500/5 border-blue-500/20">
                            <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">Viva Agent Active</p>
                                <p className="text-xs text-muted-foreground">Currently processing 3 live sessions.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
