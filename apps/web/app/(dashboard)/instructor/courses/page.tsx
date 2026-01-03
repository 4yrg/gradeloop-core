"use client"

import { Info, Plus, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CourseCard, CreateCourseCard } from "@/features/instructor/components/course-card"
import Link from "next/link"

const SEMESTERS = [
    {
        id: "2025-s1",
        name: "2025 Semester 1 (Jan-June)",
        courses: [
            {
                id: "1",
                title: "Introduction to programming",
                code: "IT SE IT1010",
                description: "Lorem ipsum dolor sit amet consectetur.",
                assignmentsCount: 2,
            },
        ]
    },
    {
        id: "2025-s2",
        name: "2025 Semester 2 (Jan-June)",
        courses: [
            {
                id: "2",
                title: "Data structures and algorithms",
                code: "IT SE IT2070",
                description: "Lorem ipsum dolor sit amet consectetur.",
                assignmentsCount: 2,
            },
        ]
    }
]

export default function InstructorCoursesPage() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-theme(spacing.16))]">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight">Your courses</h1>
            </div>

            {/* Info Banner */}
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 p-3 rounded-md mb-8 text-sm">
                <div className="bg-black text-white rounded-full p-0.5">
                    <Info className="h-3 w-3" />
                </div>
                <span className="text-muted-foreground">
                    Everything you need to know about gradeloop is with <Link href="#" className="underline text-foreground decoration-zinc-400 underline-offset-4">Getting started guide</Link>.
                </span>
            </div>

            {/* Course Sections */}
            <div className="flex-1 space-y-10 pb-20">
                {SEMESTERS.map((semester) => (
                    <div key={semester.id} className="space-y-4">
                        <h2 className="text-sm font-semibold text-foreground/90">{semester.name}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {semester.courses.map((course) => (
                                <Link key={course.id} href={`/instructor/courses/${course.id}`} className="aspect-[4/3] w-full max-w-sm">
                                    <CourseCard
                                        title={course.title}
                                        code={course.code}
                                        description={course.description}
                                        assignmentsCount={course.assignmentsCount}
                                    />
                                </Link>
                            ))}
                            <Link href="/instructor/courses/create" className="aspect-[4/3] w-full max-w-sm">
                                <CreateCourseCard />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
                <div className="flex h-14 items-center justify-between px-4 lg:px-8">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <User className="h-4 w-4" />
                        Account
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm">
                            Enroll in course
                        </Button>
                        <Link href="/instructor/courses/create">
                            <Button size="sm" className="gap-2 bg-black hover:bg-black/90 text-white">
                                <Plus className="h-4 w-4" />
                                Create course
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
