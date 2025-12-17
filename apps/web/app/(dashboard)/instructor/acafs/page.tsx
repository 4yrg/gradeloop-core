"use client"

import { useQuery } from "@tanstack/react-query"
import { InstructorService } from "@/services/instructor.service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Brain, CheckCircle2, AlertCircle, TrendingUp, Search, Eye } from "lucide-react"
import Link from "next/link"

export default function ACAFSDashboardPage() {
    const { data: summary } = useQuery({
        queryKey: ['acafs-summary'],
        queryFn: InstructorService.getAcafsSummary
    })

    const { data: classes } = useQuery({
        queryKey: ['instructor-classes'],
        queryFn: InstructorService.getClasses
    })

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">ACAFS Dashboard</h1>
                <p className="text-muted-foreground">Automated Code Assessment & Feedback System</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Auto-Graded
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{summary?.autoGradedCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Submissions processed</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Brain className="h-4 w-4 text-blue-600" />
                            AI Accuracy
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">{summary?.aiAccuracy || 0}%</div>
                        <Progress value={summary?.aiAccuracy || 0} className="mt-2 h-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            Needs Review
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-600">{summary?.needsReviewCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Interventions required</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Avg Grade
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{summary?.averageGrade || 0}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Across all submissions</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filter Submissions</CardTitle>
                    <CardDescription>Search and filter AI-assessed submissions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search by student name..." className="pl-9" />
                        </div>
                        <Select>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="All Classes" />
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
                        <Select>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="auto-graded">Auto-Graded</SelectItem>
                                <SelectItem value="needs-review">Needs Review</SelectItem>
                                <SelectItem value="reviewed">Reviewed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* AI Feedback Quality */}
            <Card>
                <CardHeader>
                    <CardTitle>AI Feedback Quality Metrics</CardTitle>
                    <CardDescription>Performance of AI-generated assessments</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[
                            { metric: 'Accuracy', value: 92.5, color: 'bg-green-500' },
                            { metric: 'Consistency', value: 88.0, color: 'bg-blue-500' },
                            { metric: 'Helpfulness', value: 85.5, color: 'bg-purple-500' },
                            { metric: 'Completeness', value: 90.0, color: 'bg-orange-500' }
                        ].map((item) => (
                            <div key={item.metric} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{item.metric}</span>
                                    <span className="text-muted-foreground">{item.value}%</span>
                                </div>
                                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${item.color} transition-all`}
                                        style={{ width: `${item.value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Submissions Requiring Review */}
            <Card>
                <CardHeader>
                    <CardTitle>Submissions Requiring Review</CardTitle>
                    <CardDescription>AI assessments that need instructor intervention</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {summary?.needsReviewSubmissions?.map((submission: any) => (
                            <div key={submission.id} className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Badge variant="outline">
                                            {submission.assignmentTitle}
                                        </Badge>
                                        <Badge variant="destructive">
                                            Needs Review
                                        </Badge>
                                    </div>
                                    <p className="text-sm font-medium">Student: {submission.studentName}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Reason: {submission.reviewReason}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                        <span>AI Grade: {submission.aiGrade}%</span>
                                        <span>Confidence: {submission.confidence}%</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/instructor/acafs/submission/${submission.id}`}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            Review
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {(!summary?.needsReviewSubmissions || summary.needsReviewSubmissions.length === 0) && (
                            <div className="text-center py-12 border rounded-lg bg-muted/10">
                                <CheckCircle2 className="h-12 w-12 mx-auto text-green-600/50 mb-4" />
                                <p className="text-muted-foreground">All submissions reviewed!</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Recent AI Assessments */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent AI Assessments</CardTitle>
                    <CardDescription>Latest auto-graded submissions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {summary?.recentAssessments?.map((assessment: any) => (
                            <div key={assessment.id} className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-medium">{assessment.studentName}</p>
                                        <Badge variant="outline" className="text-xs">
                                            {assessment.assignmentTitle}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(assessment.timestamp).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <div className="text-lg font-bold">{assessment.grade}%</div>
                                        <div className="text-xs text-muted-foreground">
                                            {assessment.confidence}% confidence
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/instructor/acafs/submission/${assessment.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
