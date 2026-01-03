"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    BookOpen,
} from "lucide-react"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { SidebarShell } from "./sidebar-shell"

export function InstructorSidebar() {
    const pathname = usePathname()

    return (
        <SidebarShell>
            <SidebarGroup>
                <SidebarGroupLabel>Instructor</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>

                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === "/dashboard"}
                                tooltip="Overview"
                            >
                                <Link href="/dashboard">
                                    <LayoutDashboard />
                                    <span>Overview</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </SidebarShell>
    )
}
