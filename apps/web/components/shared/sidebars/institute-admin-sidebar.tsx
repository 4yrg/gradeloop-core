<<<<<<< HEAD
'use client';

import { BaseSidebar } from "./base-sidebar";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Building2, Users, School, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function InstituteAdminSidebar() {
    const pathname = usePathname();

    return (
        <BaseSidebar>
            <SidebarGroup>
                <SidebarGroupLabel className="font-bold text-lg h-auto py-2 group-data-[collapsible=icon]:hidden">Institute Admin</SidebarGroupLabel>
                <SidebarGroupContent className="group-data-[collapsible=icon]:hidden">
                    <p className="px-2 py-4 text-sm text-muted-foreground leading-relaxed">
                        Manage your institute, staff, and student enrollments.
                    </p>
                </SidebarGroupContent>
            </SidebarGroup>
=======
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Building2,
    GraduationCap,
    CalendarDays,
    BookOpen,
    Users,
    Settings,
    ArrowLeft,
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
    // "Simple" regex to grab degree ID from /institute-admin/degrees/[id]...
    const degreeMatch = pathname?.match(/\/institute-admin\/degrees\/([^\/]+)/)
    const degreeId = degreeMatch ? degreeMatch[1] : null

    // If we are inside a specific degree (and not just the list), show Context Menu
    if (degreeId && degreeId !== "new") {
        return (
            <SidebarShell>
                <SidebarGroup>
                    <SidebarGroupLabel>Degree Management</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    tooltip="Back to Degrees"
                                >
                                    <Link href="/institute-admin/degrees">
                                        <ArrowLeft />
                                        <span>Back to Degrees</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname?.includes(`/degrees/${degreeId}/classes`)}
                                    tooltip="Classes"
                                >
                                    <Link href={`/institute-admin/degrees/${degreeId}/classes`}>
                                        <Users />
                                        <span>Classes</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname?.includes(`/degrees/${degreeId}/courses`)}
                                    tooltip="Courses"
                                >
                                    <Link href={`/institute-admin/degrees/${degreeId}/courses`}>
                                        <BookOpen />
                                        <span>Courses</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname?.includes(`/degrees/${degreeId}/settings`)}
                                    tooltip="Degree Settings"
                                >
                                    <Link href={`/institute-admin/degrees/${degreeId}/settings`}>
                                        <Settings />
                                        <span>Degree Settings</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarShell>
        )
    }

    // Default Admin Sidebar
    return (
        <SidebarShell>
>>>>>>> origin/develop
            <SidebarGroup>
                <SidebarGroupLabel>Institute</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
<<<<<<< HEAD
                            <SidebarMenuButton asChild isActive={pathname === "/institute-admin"} tooltip="Dashboard">
                                <Link href="/institute-admin">
                                    <LayoutDashboard />
                                    <span>Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === "/institute-admin/staff"} tooltip="Staff Management">
                                <Link href="/institute-admin">
                                    <Users />
                                    <span>Staff Management</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === "/institute-admin/departments"} tooltip="Departments">
                                <Link href="/institute-admin">
                                    <School />
                                    <span>Departments</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === "/institute-admin/settings"} tooltip="Institute Settings">
                                <Link href="/institute-admin">
                                    <Building2 />
                                    <span>Settings</span>
=======
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === "/institute-admin/dashboard"}
                                tooltip="Dashboard"
                            >
                                <Link href="/institute-admin/dashboard">
                                    <Building2 />
                                    <span>Dashboard</span>
>>>>>>> origin/develop
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
<<<<<<< HEAD
        </BaseSidebar>
    );
=======
            <SidebarGroup>
                <SidebarGroupLabel>Management</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === "/institute-admin/degrees"}
                                tooltip="Degrees"
                            >
                                <Link href="/institute-admin/degrees">
                                    <GraduationCap />
                                    <span>Degrees</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname?.startsWith("/institute-admin/semesters")}
                                tooltip="Semesters"
                            >
                                <Link href="/institute-admin/semesters">
                                    <CalendarDays />
                                    <span>Semesters</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname?.startsWith("/institute-admin/people")}
                                tooltip="People"
                            >
                                <Link href="/institute-admin/people">
                                    <Users />
                                    <span>People</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </SidebarShell>
    )
>>>>>>> origin/develop
}
