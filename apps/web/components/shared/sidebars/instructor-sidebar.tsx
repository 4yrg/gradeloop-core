<<<<<<< HEAD
'use client';

import { BaseSidebar } from "./base-sidebar";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from "@/components/ui/sidebar";
import { BookOpen, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

export function InstructorSidebar() {
    const pathname = usePathname();

    return (
        <BaseSidebar>
            <SidebarGroup>
                <SidebarGroupLabel className="font-bold text-lg h-auto py-2 group-data-[collapsible=icon]:hidden">Your Courses</SidebarGroupLabel>
                <SidebarGroupContent className="group-data-[collapsible=icon]:hidden">
                    <p className="px-2 py-4 text-sm text-muted-foreground leading-relaxed">
                        Manage your courses, assignments and students effectively with our instructor tools.
                    </p>
=======
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
>>>>>>> origin/develop
                </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
<<<<<<< HEAD
                            <SidebarMenuButton asChild isActive={pathname === "/instructor"} tooltip="Dashboard">
                                <Link href="/instructor">
                                    <LayoutDashboard />
                                    <span>Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === "/instructor/courses"} tooltip="Courses">
                                <Link href="/instructor">
                                    <BookOpen />
                                    <span>Courses</span>
=======
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === "/dashboard"}
                                tooltip="Overview"
                            >
                                <Link href="/dashboard">
                                    <LayoutDashboard />
                                    <span>Overview</span>
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
        </SidebarShell>
    )
>>>>>>> origin/develop
}
