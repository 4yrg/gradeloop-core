"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Activity, ShieldCheck, Server, Users } from "lucide-react"

export default function AdminDashboard() {
    const stats = [
        { label: "System Uptime", value: "99.9%", icon: Activity, color: "text-green-500" },
        { label: "Total Users", value: "1,204", icon: Users, color: "text-blue-500" },
        { label: "Judge0 Nodes", value: "4/4 Online", icon: Server, color: "text-orange-500" },
        { label: "Plagiarism Checks", value: "240 Today", icon: ShieldCheck, color: "text-purple-500" },
    ]

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Administration</h1>
                <p className="text-muted-foreground">Monitor system health and user activity.</p>
            </div>

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

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Resource Usage</CardTitle>
                        <CardDescription>CPU and Memory utilization of execution nodes.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
                        (Metrics Chart)
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Errors</CardTitle>
                        <CardDescription>System logs and failures.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            <div className="text-red-500">[Error] Judge0 Timeout (Node 3) - 10:24 AM</div>
                            <div className="text-orange-500">[Warn] High Memory Usage (Worker 2) - 09:15 AM</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
