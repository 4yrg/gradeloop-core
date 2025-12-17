"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    FileText,
    LogOut,
    Settings
} from "lucide-react"

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/student/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "My Courses",
        href: "/student/courses",
        icon: BookOpen,
    },
    {
        title: "Calendar",
        href: "/student/calendar",
        icon: Calendar,
    },
    {
        title: "Reports",
        href: "/student/reports",
        icon: FileText,
    },
]

interface StudentSidebarProps {
    className?: string
}

export function StudentSidebar({ className }: StudentSidebarProps) {
    const pathname = usePathname()

    return (
        <div className={cn("pb-12 min-h-screen border-r bg-background", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        GradeLoop
                    </h2>
                    <div className="space-y-1">
                        {sidebarItems.map((item) => (
                            <Button
                                key={item.href}
                                variant={pathname?.startsWith(item.href) ? "secondary" : "ghost"}
                                className="w-full justify-start"
                                asChild
                            >
                                <Link href={item.href}>
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Settings
                    </h2>
                    <div className="space-y-1">
                        <Button variant="ghost" className="w-full justify-start">
                            <Settings className="mr-2 h-4 w-4" />
                            Profile
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
