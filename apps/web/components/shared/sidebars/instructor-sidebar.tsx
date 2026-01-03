"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    BookOpen,
    User,
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
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === "/instructor/courses"}
                                tooltip="Your Courses"
                            >
                                <Link href="/instructor/courses">
                                    <BookOpen />
                                    <span>Your Courses</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === "/instructor/account"}
                                tooltip="Account"
                            >
                                <Link href="/instructor/account">
                                    <User />
                                    <span>Account</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </SidebarShell>
    )
}
