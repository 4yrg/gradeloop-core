"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Building2,
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

export function InstituteAdminSidebar() {
    const pathname = usePathname()

    return (
        <SidebarShell>
            <SidebarGroup>
                <SidebarGroupLabel>Institute</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === "/institute-admin"}
                                tooltip="Dashboard"
                            >
                                <Link href="/institute-admin">
                                    <Building2 />
                                    <span>Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
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
