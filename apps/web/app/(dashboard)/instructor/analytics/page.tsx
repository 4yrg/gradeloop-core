"use client"

import { useQuery } from "@tanstack/react-query"
import { InstructorService } from "@/services/instructor.service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { BarChart3, TrendingUp, Users, FileText, Download } from "lucide-react"

export default function AnalyticsPage() {
    const { data: classes } = useQuery({
        queryKey: ['instructor-classes'],
        queryFn: InstructorService.getClasses
    })

    const { data: analytics } = useQuery({
        queryKey: ['class-analytics', 'all'],
        queryFn: () => InstructorService.getClassAnalytics('all')
    })

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
                    <p className="text-muted-foreground">Performance insights and trends</p>
                </div>
                <div className="flex gap-2">
                    <Select defaultValue="all">
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {classes?.map((cls: any) => (
                                <SelectItem key={cls.id} value={cls.id}>
                                    {cls.course?.code}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Students
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{analytics?.totalStudents || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Across all classes</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Avg Completion
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{analytics?.avgCompletion || 0}%</div>
                        <Progress value={analytics?.avgCompletion || 0} className="mt-2 h-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Avg Grade
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{analytics?.avgGrade || 0}%</div>
                        <Progress value={analytics?.avgGrade || 0} className="mt-2 h-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Assignments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{analytics?.totalAssignments || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total created</p>
                    </CardContent>
                </Card>
            </div>

            {/* Grade Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Grade Distribution</CardTitle>
                    <CardDescription>Distribution of student grades across all assignments</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[
                            { range: 'A (90-100%)', count: 45, color: 'bg-green-500', percentage: 30 },
                            { range: 'B (80-89%)', count: 52, color: 'bg-blue-500', percentage: 35 },
                            { range: 'C (70-79%)', count: 35, color: 'bg-yellow-500', percentage: 23 },
                            { range: 'D (60-69%)', count: 12, color: 'bg-orange-500', percentage: 8 },
                            { range: 'F (0-59%)', count: 6, color: 'bg-red-500', percentage: 4 }
                        ].map((item) => (
                            <div key={item.range} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{item.range}</span>
                                    <span className="text-muted-foreground">{item.count} students ({item.percentage}%)</span>
                                </div>
                                <div className="h-8 w-full bg-muted rounded-lg overflow-hidden">
                                    <div
                                        className={`h-full ${item.color} transition-all`}
                                        style={{ width: `${item.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Assignment Completion Rates */}
                <Card>
                    <CardHeader>
                        <CardTitle>Assignment Completion Rates</CardTitle>
                        <CardDescription>Submission rates by assignment</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analytics?.assignmentStats?.map((stat: any) => (
                                <div key={stat.assignmentId} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">{stat.title}</span>
                                        <span className="text-muted-foreground">
                                            {stat.submitted}/{stat.total} ({Math.round((stat.submitted / stat.total) * 100)}%)
                                        </span>
                                    </div>
                                    <Progress value={(stat.submitted / stat.total) * 100} className="h-2" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Performance Trends */}
                <Card>
                    <CardHeader>
                        <CardTitle>Performance Trends</CardTitle>
                        <CardDescription>Average grades over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { week: 'Week 1', grade: 75 },
                                { week: 'Week 2', grade: 78 },
                                { week: 'Week 3', grade: 82 },
                                { week: 'Week 4', grade: 80 },
                                { week: 'Week 5', grade: 85 }
                            ].map((item) => (
                                <div key={item.week} className="flex items-center gap-4">
                                    <span className="text-sm font-medium w-20">{item.week}</span>
                                    <div className="flex-1">
                                        <Progress value={item.grade} className="h-2" />
                                    </div>
                                    <span className="text-sm font-bold w-12 text-right">{item.grade}%</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Class Performance Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle>Class Performance Comparison</CardTitle>
                    <CardDescription>Average performance across different classes</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {classes?.slice(0, 5).map((cls: any) => (
                            <div key={cls.id} className="flex items-center gap-4">
                                <div className="w-32">
                                    <p className="text-sm font-medium">{cls.course?.code}</p>
                                    <p className="text-xs text-muted-foreground">{cls.studentCount} students</p>
                                </div>
                                <div className="flex-1">
                                    <Progress value={Math.random() * 30 + 70} className="h-3" />
                                </div>
                                <span className="text-sm font-bold w-12 text-right">
                                    {Math.round(Math.random() * 30 + 70)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
