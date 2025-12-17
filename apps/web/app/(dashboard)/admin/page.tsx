"use client"

import { useQuery } from "@tanstack/react-query"
import { AdminService } from "@/services/admin.service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Activity, Users, FileText, AlertTriangle, ShieldAlert, Cpu, Brain, Lock } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

export default function AdminDashboard() {

    const { data: summary } = useQuery({
        queryKey: ['admin-summary'],
        queryFn: AdminService.getDashboardSummary
    })

    const { data: aiStats } = useQuery({
        queryKey: ['admin-ai-gov'],
        queryFn: AdminService.getAIGovernanceStats
    })

    const { data: alerts } = useQuery({
        queryKey: ['admin-alerts'],
        queryFn: AdminService.getSystemAlerts
    })

    return (
        <div className="space-y-8 animate-in fade-in duration-500 p-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
                <p className="text-muted-foreground">Global health, AI governance, and system alerts.</p>
            </div>

            {/* System Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.totalUsers.student ? summary.totalUsers.student + summary.totalUsers.instructor : "..."}</div>
                        <p className="text-xs text-muted-foreground">
                            {summary?.totalUsers.instructor} Instructors, {summary?.totalUsers.student} Students
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.activeClasses || "..."}</div>
                        <p className="text-xs text-muted-foreground">{summary?.activeAssignments} Active Assignments</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Load</CardTitle>
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.systemUsage.cpu || 0}%</div>
                        <p className="text-xs text-muted-foreground">
                            {summary?.systemUsage.executions.toLocaleString()} Executions today
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Integrity Flags</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{summary?.flaggedCases || 0}</div>
                        <p className="text-xs text-muted-foreground">Requires attention</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* AI Governance Snapshot */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5 text-purple-500" />
                            AI Governance Snapshot
                        </CardTitle>
                        <CardDescription>Overview of AI usage and grading reliability.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 border rounded-lg bg-card/50">
                                    <div className="text-sm font-medium text-muted-foreground">AI Grading Enabled</div>
                                    <div className="text-2xl font-bold mt-1">{aiStats?.aiGradingEnabledClasses || 0}</div>
                                    <div className="text-xs text-muted-foreground">Classes</div>
                                </div>
                                <div className="p-4 border rounded-lg bg-card/50">
                                    <div className="text-sm font-medium text-muted-foreground">Avg. AI Likelihood</div>
                                    <div className="text-2xl font-bold mt-1">{aiStats?.avgAiLikelihood || 0}%</div>
                                    <div className="text-xs text-muted-foreground">Across all submissions</div>
                                </div>
                                <div className="p-4 border rounded-lg bg-card/50">
                                    <div className="text-sm font-medium text-muted-foreground">Agent Usage Rate</div>
                                    <div className="text-2xl font-bold mt-1">{aiStats?.agentUsageRate || 0}%</div>
                                    <div className="text-xs text-muted-foreground">Of active students</div>
                                </div>
                            </div>

                            {/* Visual Placeholder for a chart */}
                            <div className="h-[200px] w-full bg-secondary/20 rounded-lg flex items-center justify-center border border-dashed">
                                <span className="text-muted-foreground text-sm">AI Activity Trend Chart Placeholder</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Alerts Panel */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            System Alerts
                        </CardTitle>
                        <CardDescription>Recent warnings and critical issues.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-4">
                                {alerts?.map((alert) => (
                                    <div key={alert.id} className="flex gap-4 items-start p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors">
                                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${alert.type === 'error' ? 'bg-red-500' :
                                                alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                                            }`} />
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{alert.message}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 capitalize">
                                                    {alert.category}
                                                </Badge>
                                                <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {!alerts?.length && (
                                    <div className="text-sm text-center text-muted-foreground py-8">
                                        No active alerts. System is healthy.
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
