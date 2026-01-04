"use client";

import { useEffect, useState } from "react";
import { Users, GraduationCap, BookOpen, CalendarDays, Activity } from "lucide-react";
import { StatsCard } from "@/features/institute-admin/components/stats-card";
import { dashboardService, DashboardStats, ActivityItem } from "@/features/institute-admin/api/dashboard-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, activityData] = await Promise.all([
                    dashboardService.getStats(),
                    dashboardService.getRecentActivity()
                ]);
                setStats(statsData);
                setActivity(activityData);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;
    }

    if (!stats) return null;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatsCard
                    title="Total Students"
                    value={stats.totalStudents}
                    icon={Users}
                    description="+10% from last semester"
                />
                <StatsCard
                    title="Active Courses"
                    value={stats.activeCourses}
                    icon={BookOpen}
                    description="Spring 2024"
                />
                <StatsCard
                    title="Instructors"
                    value={stats.totalInstructors}
                    icon={GraduationCap}
                    description=" Across 5 departments"
                />

            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {activity.map((item) => (
                                <div key={item.id} className="flex items-center">
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">{item.action}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {item.details}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium text-xs text-muted-foreground">
                                        {new Date(item.timestamp).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Coming soon: Shortcuts to create courses, add users, etc.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
