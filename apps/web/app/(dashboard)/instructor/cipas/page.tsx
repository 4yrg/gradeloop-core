"use client"

import { useQuery } from "@tanstack/react-query"
import { InstructorService } from "@/services/instructor.service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Shield, AlertTriangle, TrendingUp, Search, Eye, FileText } from "lucide-react"
import Link from "next/link"

export default function CIPASDashboardPage() {
    const { data: summary } = useQuery({
        queryKey: ['cipas-summary'],
        queryFn: InstructorService.getCipasSummary
    })

    const { data: reports } = useQuery({
        queryKey: ['plagiarism-reports'],
        queryFn: InstructorService.getPlagiarismReports
    })

    const { data: classes } = useQuery({
        queryKey: ['instructor-classes'],
        queryFn: InstructorService.getClasses
    })

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">CIPAS Dashboard</h1>
                <p className="text-muted-foreground">Code Integrity & Provenance Analysis System</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Submissions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{summary?.totalSubmissions || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Analyzed</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            Flagged Cases
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600">{summary?.flaggedCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {summary?.totalSubmissions ? Math.round((summary.flaggedCount / summary.totalSubmissions) * 100) : 0}% of total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Avg Similarity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{summary?.averageSimilarity || 0}%</div>
                        <Progress value={summary?.averageSimilarity || 0} className="mt-2 h-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-600" />
                            AI-Generated
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">{summary?.aiGeneratedCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Suspected cases</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filter Reports</CardTitle>
                    <CardDescription>Search and filter plagiarism reports</CardDescription>
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
                                <SelectItem value="flagged">Flagged</SelectItem>
                                <SelectItem value="reviewed">Reviewed</SelectItem>
                                <SelectItem value="false-positive">False Positive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Similarity Distribution Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Similarity Distribution</CardTitle>
                    <CardDescription>Distribution of similarity scores across submissions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[
                            { range: '0-20%', count: 95, color: 'bg-green-500' },
                            { range: '21-40%', count: 35, color: 'bg-yellow-500' },
                            { range: '41-60%', count: 12, color: 'bg-orange-500' },
                            { range: '61-80%', count: 6, color: 'bg-red-500' },
                            { range: '81-100%', count: 2, color: 'bg-red-700' }
                        ].map((item) => (
                            <div key={item.range} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{item.range}</span>
                                    <span className="text-muted-foreground">{item.count} submissions</span>
                                </div>
                                <div className="h-8 w-full bg-muted rounded-lg overflow-hidden">
                                    <div
                                        className={`h-full ${item.color} transition-all`}
                                        style={{ width: `${(item.count / 150) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Flagged Reports */}
            <Card>
                <CardHeader>
                    <CardTitle>Flagged Reports</CardTitle>
                    <CardDescription>High similarity submissions requiring review</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {reports?.map((report: any) => (
                            <div key={report.id} className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Badge variant={
                                            report.similarityPercentage > 70 ? 'destructive' :
                                                report.similarityPercentage > 50 ? 'default' : 'secondary'
                                        }>
                                            {report.similarityPercentage}% Similar
                                        </Badge>
                                        <Badge variant="outline">
                                            {report.status.replace('-', ' ').toUpperCase()}
                                        </Badge>
                                    </div>
                                    <p className="text-sm font-medium">Submission {report.submissionId}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Matched with: Submission {report.matchedSubmissionId}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {report.matchedBlocks?.length || 0} code block(s) matched
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/instructor/cipas/diff/${report.submissionId}`}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            View Diff
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/instructor/submissions/${report.submissionId}`}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            Review
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {(!reports || reports.length === 0) && (
                            <div className="text-center py-12 border rounded-lg bg-muted/10">
                                <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground">No flagged reports</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
