"use client"

import { useQuery } from "@tanstack/react-query"
import { InstructorService } from "@/services/instructor.service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    FileText,
    Search,
    Plus,
    Clock,
    Users,
    BarChart3,
    Filter
} from "lucide-react"
import Link from "next/link"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function InstructorAssignmentsPage() {
    const { data: assignments, isLoading } = useQuery({
        queryKey: ['instructor-all-assignments'],
        queryFn: InstructorService.getAllAssignments
    })

    const { data: classes } = useQuery({
        queryKey: ['instructor-classes'],
        queryFn: InstructorService.getClasses
    })

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
                    <p className="text-muted-foreground">Manage assignments across all your classes</p>
                </div>
                <Button asChild>
                    <Link href="/instructor/assignments/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Assignment
                    </Link>
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search assignments..." className="pl-9" />
                </div>
                <Select>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <Filter className="mr-2 h-4 w-4" />
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
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Assignment List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-muted animate-pulse rounded-lg border" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-4">
                    {assignments?.map((assignment: any) => {
                        const assignmentClass = classes?.find((c: any) =>
                            c.course?.id === assignment.courseId
                        )

                        return (
                            <Card key={assignment.id} className="hover:border-primary/50 transition-colors">
                                <CardHeader>
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="outline">
                                                    {assignmentClass?.course?.code || 'Unknown'}
                                                </Badge>
                                                <Badge variant={assignment.status === 'open' ? 'default' : 'secondary'}>
                                                    {assignment.status}
                                                </Badge>
                                                <Badge variant="outline">{assignment.type}</Badge>
                                            </div>
                                            <CardTitle className="text-xl">{assignment.title}</CardTitle>
                                            <CardDescription className="mt-1">
                                                {assignment.description}
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/instructor/assignments/${assignment.id}/edit`}>
                                                    Edit
                                                </Link>
                                            </Button>
                                            <Button size="sm" asChild>
                                                <Link href={`/instructor/assignments/${assignment.id}`}>
                                                    View Details
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Due Date</p>
                                                <p className="font-medium">
                                                    {new Date(assignment.dueDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Points</p>
                                                <p className="font-medium">{assignment.points}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Submissions</p>
                                                <p className="font-medium">45 / {assignmentClass?.studentCount || 0}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Avg Grade</p>
                                                <p className="font-medium">78.5%</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {assignments?.length === 0 && !isLoading && (
                <div className="text-center py-12 border rounded-lg bg-muted/10">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No assignments found</p>
                    <Button className="mt-4" asChild>
                        <Link href="/instructor/assignments/create">Create Your First Assignment</Link>
                    </Button>
                </div>
            )}
        </div>
    )
}
