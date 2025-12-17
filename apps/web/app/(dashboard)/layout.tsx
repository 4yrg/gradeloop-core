"use client"

import { Sidebar } from "@/components/navigation/Sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Each role (student, instructor, admin) has its own layout with sidebar
    // This parent layout just wraps them
    return <>{children}</>
}
