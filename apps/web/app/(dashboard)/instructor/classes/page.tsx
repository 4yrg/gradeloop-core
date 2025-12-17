"use client"

import { useQuery } from "@tanstack/react-query"
import { InstructorService } from "@/services/instructor.service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Users, BookOpen, FileText, Search, Plus } from "lucide-react"
import Link from "next/link"

export default function InstructorClassesPage() {
    const { data: classes, isLoading } = useQuery({
        queryKey: ['instructor-classes'],
        queryFn: InstructorService.getClasses
    })

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
                    <p className="text-muted-foreground">Manage your assigned classes and students</p>
                </div>
                <Button asChild>
                    <Link href="/instructor/classes/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Class
                    </Link>
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search classes..." className="pl-9" />
                </div>
            </div>

            {/* Class Cards */}
            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-muted animate-pulse rounded-lg border" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {classes?.map((classItem: any) => (
                        <Card key={classItem.id} className="hover:border-primary/50 transition-colors group">
                            <div className="h-32 w-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-t-lg relative overflow-hidden">
                                <div className="absolute top-2 right-2">
                                    <Badge variant={classItem.status === 'active' ? 'default' : 'secondary'}>
                                        {classItem.status}
                                    </Badge>
                                </div>
                                <div className="absolute bottom-2 left-2">
                                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                                        {classItem.batch}
                                    </Badge>
                                </div>
                            </div>
                            <CardHeader>
                                <div className="flex items-start justify-between mb-2">
                                    <Badge variant="outline">{classItem.course?.code}</Badge>
                                </div>
                                <CardTitle className="line-clamp-1">{classItem.course?.name}</CardTitle>
                                <CardDescription className="line-clamp-2">
                                    {classItem.course?.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            <Users className="h-4 w-4" />
                                            Students
                                        </span>
                                        <span className="font-medium">{classItem.studentCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            <FileText className="h-4 w-4" />
                                            Assignments
                                        </span>
                                        <span className="font-medium">{classItem.assignmentCount}</span>
                                    </div>
                                    <div className="pt-2">
                                        <Button className="w-full" asChild>
                                            <Link href={`/instructor/classes/${classItem.id}`}>
                                                <BookOpen className="mr-2 h-4 w-4" />
                                                Enter Class
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {classes?.length === 0 && !isLoading && (
                <div className="text-center py-12 border rounded-lg bg-muted/10">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No classes found</p>
                    <Button className="mt-4" asChild>
                        <Link href="/instructor/classes/create">Create Your First Class</Link>
                    </Button>
                </div>
            )}
        </div>
    )
}
