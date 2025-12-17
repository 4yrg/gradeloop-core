"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, BookOpen, MoreVertical, Settings } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

export default function InstructorCoursesPage() {
    const courses = [
        { id: "cs101", code: "CS101", title: "Introduction to Computer Science", students: 142, status: "Active" },
        { id: "se202", code: "SE202", title: "Software Engineering Principles", students: 89, status: "Active" },
        { id: "algo303", code: "ALGO303", title: "Advanced Algorithms", students: 0, status: "Draft" },
    ]

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Access Course Management</h1>
                    <p className="text-muted-foreground">Manage your teaching materials and student enrollments.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Create Course
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map(course => (
                    <Card key={course.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/10 transition-colors">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <div>
                                <Badge variant="outline" className="mb-2">{course.code}</Badge>
                                <CardTitle className="text-lg">{course.title}</CardTitle>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/instructor/courses/${course.id}`}>View Details</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>Edit Settings</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600">Archive Course</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
                                <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    <span>{course.students} Students</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <BookOpen className="h-4 w-4" />
                                    <span>{course.status}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
