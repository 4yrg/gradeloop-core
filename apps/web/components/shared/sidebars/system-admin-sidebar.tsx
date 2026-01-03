<<<<<<< HEAD
'use client';

import { BaseSidebar } from "./base-sidebar";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Settings, Users, ShieldAlert, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SystemAdminSidebar() {
    const pathname = usePathname();

    return (
        <BaseSidebar>
            <SidebarGroup>
                <SidebarGroupLabel className="font-bold text-lg h-auto py-2 group-data-[collapsible=icon]:hidden">System Admin</SidebarGroupLabel>
                <SidebarGroupContent className="group-data-[collapsible=icon]:hidden">
                    <p className="px-2 py-4 text-sm text-muted-foreground leading-relaxed">
                        Manage the entire platform, users, and global settings.
                    </p>
                </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
                <SidebarGroupLabel>Administration</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === "/system-admin"} tooltip="Overview">
                                <Link href="/system-admin">
=======
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Users,
    Settings,
    Monitor,
    School,
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

export function SystemAdminSidebar() {
    const pathname = usePathname()

    const items = [
        {
            title: "Dashboard",
            href: "/system-admin",
            icon: LayoutDashboard,
        },
        {
            title: "Institutes",
            href: "/system-admin/institutes",
            icon: School,
        },
        {
            title: "Monitoring",
            href: "/system-admin/monitoring",
            icon: Monitor,
        },
        {
            title: "Users",
            href: "/users",
            icon: Users,
        },
    ]

    return (
        <SidebarShell>
            <SidebarGroup>
                <SidebarGroupLabel>Platform</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        {items.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname === item.href}
                                    tooltip={item.title}
                                >
                                    <Link href={item.href}>
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
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
>>>>>>> origin/develop
                                    <LayoutDashboard />
                                    <span>Overview</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
<<<<<<< HEAD
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === "/system-admin/users"} tooltip="User Management">
                                <Link href="/system-admin">
                                    <Users />
                                    <span>User Management</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === "/system-admin/reports"} tooltip="System Logs">
                                <Link href="/system-admin">
                                    <ShieldAlert />
                                    <span>System Logs</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === "/system-admin/settings"} tooltip="Settings">
                                <Link href="/system-admin">
                                    <Settings />
                                    <span>Settings</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </BaseSidebar>
    );
=======
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </SidebarShell>
    )
>>>>>>> origin/develop
}
