"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    LayoutDashboard,
    BookOpen,
    FileCode,
    Settings,
    ShieldAlert,
    GraduationCap,
    Users,
    BarChart,
    Code
} from "lucide-react"
import { useUserStore, UserRole } from "@/store/useUserStore"

type NavItem = {
    title: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    roles: UserRole[]
}

const navItems: NavItem[] = [
    // Student
    { title: "Dashboard", href: "/student", icon: LayoutDashboard, roles: ["STUDENT"] },
    { title: "My Courses", href: "/student/courses", icon: GraduationCap, roles: ["STUDENT"] },
    { title: "Assignments", href: "/student/assignments", icon: BookOpen, roles: ["STUDENT"] },

    // Instructor
    { title: "Dashboard", href: "/instructor", icon: LayoutDashboard, roles: ["INSTRUCTOR"] },
    { title: "Course Management", href: "/instructor/courses", icon: BookOpen, roles: ["INSTRUCTOR"] },
    { title: "Grading", href: "/instructor/grading", icon: FileCode, roles: ["INSTRUCTOR"] },
    { title: "CIPAS Analysis", href: "/instructor/cipas", icon: ShieldAlert, roles: ["INSTRUCTOR"] },

    // Admin
    { title: "Overview", href: "/admin", icon: BarChart, roles: ["ADMIN"] },
    { title: "User Management", href: "/admin/users", icon: Users, roles: ["ADMIN"] },
    { title: "System Tools", href: "/admin/tools", icon: Settings, roles: ["ADMIN"] },
]

export function Sidebar() {
    const pathname = usePathname()
    const { user } = useUserStore()
    const role = user?.currentRole || "STUDENT" // Default fallback for dev

    const filteredItems = navItems.filter((item) => item.roles.includes(role))

    return (
        <div className="flex h-screen flex-col border-r bg-card w-64">
            <div className="p-6 border-b">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                    <Code className="h-6 w-6 text-primary" />
                    <span>GradeLoop</span>
                </Link>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {filteredItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    return (
                        <Button
                            key={item.href}
                            variant={isActive ? "secondary" : "ghost"}
                            className={cn("w-full justify-start", isActive && "bg-secondary")}
                            asChild
                        >
                            <Link href={item.href}>
                                <item.icon className="mr-2 h-4 w-4" />
                                {item.title}
                            </Link>
                        </Button>
                    )
                })}
            </nav>
            {/* Footer / User Profile Sneak Peek */}
            <div className="p-4 border-t">
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {user?.name?.[0] || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium truncate">{user?.name || "Guest User"}</span>
                        <span className="text-xs text-muted-foreground truncate">{role}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
