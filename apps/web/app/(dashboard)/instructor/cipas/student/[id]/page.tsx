"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { InstructorService } from "@/services/instructor.service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { User, AlertTriangle, TrendingDown, Calendar, FileText } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function StudentCIPASProfilePage() {
    const { id } = useParams()
    const studentId = id as string

    const { data: profile, isLoading } = useQuery({
        queryKey: ['student-cipas-profile', studentId],
        queryFn: () => InstructorService.getStudentCipasProfile(studentId)
    })

    if (isLoading) {
        return <div className="p-8">Loading profile...</div>
    }

    if (!profile) {
        return <div className="p-8">Profile not found</div>
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Student Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-8 w-8" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">{profile.student?.name}</CardTitle>
                                <CardDescription>{profile.student?.email}</CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Statistics */}
            <div className="grid gap-6 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Submissions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{profile.totalSubmissions || 0}</div>
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
                        <div className="text-3xl font-bold text-red-600">{profile.flaggedCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {profile.totalSubmissions ? Math.round((profile.flaggedCount / profile.totalSubmissions) * 100) : 0}% of submissions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingDown className="h-4 w-4" />
                            Avg Similarity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{profile.averageSimilarity || 0}%</div>
                        <Progress value={profile.averageSimilarity || 0} className="mt-2 h-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Risk Level
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant={
                            profile.riskLevel === 'high' ? 'destructive' :
                                profile.riskLevel === 'medium' ? 'default' : 'secondary'
                        } className="text-lg">
                            {profile.riskLevel?.toUpperCase() || 'LOW'}
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Incident Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle>Incident Timeline</CardTitle>
                    <CardDescription>Historical plagiarism flags and reviews</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {profile.incidents?.map((incident: any) => (
                            <div key={incident.id} className="flex gap-4 p-4 rounded-lg border">
                                <div className="flex flex-col items-center">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${incident.status === 'flagged' ? 'bg-red-100 dark:bg-red-900/20' :
                                            incident.status === 'false-positive' ? 'bg-green-100 dark:bg-green-900/20' :
                                                'bg-gray-100 dark:bg-gray-900/20'
                                        }`}>
                                        <AlertTriangle className={`h-5 w-5 ${incident.status === 'flagged' ? 'text-red-600' :
                                                incident.status === 'false-positive' ? 'text-green-600' :
                                                    'text-gray-600'
                                            }`} />
                                    </div>
                                    <div className="w-px h-full bg-border mt-2" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-medium">{incident.assignmentTitle}</p>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(incident.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Badge variant={
                                            incident.similarityPercentage > 70 ? 'destructive' :
                                                incident.similarityPercentage > 50 ? 'default' : 'secondary'
                                        }>
                                            {incident.similarityPercentage}% Similar
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Matched with: {incident.matchedWith}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">
                                            {incident.status.replace('-', ' ').toUpperCase()}
                                        </Badge>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/instructor/cipas/diff/${incident.submissionId}`}>
                                                View Details
                                            </Link>
                                        </Button>
                                    </div>
                                    {incident.reviewNotes && (
                                        <p className="text-sm mt-2 p-2 rounded bg-muted">
                                            {incident.reviewNotes}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}

                        {(!profile.incidents || profile.incidents.length === 0) && (
                            <div className="text-center py-12 border rounded-lg bg-muted/10">
                                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground">No incidents recorded</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
