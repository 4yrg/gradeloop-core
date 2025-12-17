"use client"

import { useParams } from "next/parameter"
import { useQuery } from "@tanstack/react-query"
import { InstructorService } from "@/services/instructor.service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Mail, Calendar, TrendingUp, FileText, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function StudentProfilePage() {
    const { id } = useParams()
    const studentId = id as string

    const { data: profile } = useQuery({
        queryKey: ['student-profile', studentId],
        queryFn: () => InstructorService.getStudentProfile(studentId)
    })

    if (!profile) {
        return <div className="p-8">Loading...</div>
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-10 w-10" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">{profile.name}</CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                    <Mail className="h-4 w-4" />
                                    {profile.email}
                                </CardDescription>
                                <div className="flex gap-2 mt-2">
                                    <Badge>{profile.studentId}</Badge>
                                    <Badge variant="outline">{profile.program}</Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Stats */}
            <div className="grid gap-6 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Avg Grade
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{profile.averageGrade}%</div>
                        <Progress value={profile.averageGrade} className="mt-2 h-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Submissions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{profile.totalSubmissions}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {profile.onTimeSubmissions} on time
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            CIPAS Flags
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-600">{profile.cipasFlags || 0}</div>
                        <Button variant="link" className="p-0 h-auto text-xs" asChild>
                            <Link href={`/instructor/cipas/student/${studentId}`}>
                                View Details
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Completion Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{profile.completionRate}%</div>
                        <Progress value={profile.completionRate} className="mt-2 h-2" />
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="submissions">
                <TabsList>
                    <TabsTrigger value="submissions">Submissions</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="submissions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Submissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {profile.recentSubmissions?.map((submission: any) => (
                                    <div key={submission.id} className="flex items-center justify-between p-3 rounded-lg border">
                                        <div className="flex-1">
                                            <p className="font-medium">{submission.assignmentTitle}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(submission.submittedAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant={submission.grade >= 70 ? 'default' : 'destructive'}>
                                                {submission.grade}%
                                            </Badge>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/instructor/submissions/${submission.id}`}>
                                                    View
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance by Assignment Type</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {profile.performanceByType?.map((perf: any) => (
                                    <div key={perf.type} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">{perf.type}</span>
                                            <span className="text-muted-foreground">{perf.average}%</span>
                                        </div>
                                        <Progress value={perf.average} className="h-2" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activity" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {profile.recentActivity?.map((activity: any, idx: number) => (
                                    <div key={idx} className="flex gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{activity.action}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(activity.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
