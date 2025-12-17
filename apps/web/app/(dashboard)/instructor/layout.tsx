"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    Shield,
    Brain,
    BarChart3,
    MessageSquare,
    Settings,
    Bell,
    User,
    ChevronDown
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useInstructorStore } from "@/store/instructor/use-instructor-store"
import RoleGuard from "@/components/auth/RoleGuard"

export default function InstructorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const { selectedSemester, setSelectedSemester } = useInstructorStore()

    const sidebarItems = [
        { name: "Dashboard", href: "/instructor", icon: LayoutDashboard, exact: true },
        { name: "My Classes", href: "/instructor/classes", icon: BookOpen },
        { name: "Assignments", href: "/instructor/assignments", icon: FileText },
        { name: "CIPAS", href: "/instructor/cipas", icon: Shield, badge: 3 },
        { name: "ACAFS", href: "/instructor/acafs", icon: Brain },
        { name: "Analytics", href: "/instructor/analytics", icon: BarChart3 },
        { name: "Messages", href: "/instructor/messages", icon: MessageSquare, badge: 5 },
        { name: "Settings", href: "/instructor/settings", icon: Settings },
    ]

    const semesters = [
        '2024/2025 - Semester 1',
        '2024/2025 - Semester 2',
        '2023/2024 - Semester 2'
    ]

    return (
        <RoleGuard allowedRoles={['INSTRUCTOR']}>
            <div className="min-h-screen bg-background">
                {/* Top Bar */}
                <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container flex h-16 items-center justify-between px-4">
                        <div className="flex items-center gap-4">
                            <div className="font-bold text-xl">GradeLoop</div>
                            <div className="h-6 w-px bg-border" />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="gap-2">
                                        {selectedSemester}
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuLabel>Select Semester</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {semesters.map(sem => (
                                        <DropdownMenuItem
                                            key={sem}
                                            onClick={() => setSelectedSemester(sem)}
                                            className={cn(selectedSemester === sem && "bg-accent")}
                                        >
                                            {sem}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="gap-2">
                                        <User className="h-5 w-5" />
                                        Dr. John Smith
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>Profile</DropdownMenuItem>
                                    <DropdownMenuItem>Settings</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>Logout</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                <div className="flex">
                    {/* Sidebar */}
                    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 border-r bg-muted/10">
                        <nav className="flex flex-col gap-1 p-4">
                            {sidebarItems.map((item) => {
                                const isActive = item.exact
                                    ? pathname === item.href
                                    : pathname.startsWith(item.href)

                                return (
                                    <Link key={item.href} href={item.href}>
                                        <Button
                                            variant={isActive ? "secondary" : "ghost"}
                                            className={cn(
                                                "w-full justify-start gap-3",
                                                isActive && "bg-secondary"
                                            )}
                                        >
                                            <item.icon className="h-5 w-5" />
                                            <span className="flex-1 text-left">{item.name}</span>
                                            {item.badge && (
                                                <Badge variant="destructive" className="ml-auto">
                                                    {item.badge}
                                                </Badge>
                                            )}
                                        </Button>
                                    </Link>
                                )
                            })}
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 p-8">
                        <div className="mx-auto max-w-7xl">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </RoleGuard>
    )
}
