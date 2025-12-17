"use client"

import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, FileText, Megaphone, Calendar, BarChart3, Settings, BookOpen } from "lucide-react"

export default function CourseLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const { id } = useParams()
    const courseId = id as string

    const sidebarItems = [
        { name: "Overview", href: `/student/courses/${courseId}`, icon: BookOpen, exact: true },
        { name: "Assignments", href: `/student/courses/${courseId}/assignments`, icon: FileText },
        { name: "Announcements", href: `/student/courses/${courseId}/announcements`, icon: Megaphone },
        { name: "Grades", href: `/student/courses/${courseId}/grades`, icon: BarChart3 },
    ]

    return (
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-8 lg:space-y-0 animate-in fade-in duration-500">
            {/* Course Sidebar */}
            <aside className="lg:w-1/5">
                <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
                    {sidebarItems.map((item) => {
                        const isActive = item.exact
                            ? pathname === item.href
                            : pathname.startsWith(item.href)

                        return (
                            <Link key={item.href} href={item.href} className="w-full">
                                <Button
                                    variant={isActive ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start",
                                        isActive ? "bg-muted hover:bg-muted" : "hover:bg-transparent hover:underline"
                                    )}
                                >
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.name}
                                </Button>
                            </Link>
                        )
                    })}
                </nav>
            </aside>

            {/* Main Course Content */}
            <div className="flex-1 lg:w-4/5 pb-10">
                {children}
            </div>
        </div>
    )
}
