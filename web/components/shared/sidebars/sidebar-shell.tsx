"use client"

import * as React from "react"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "../../ui/sidebar"
import { LogOut } from "lucide-react"
import { UserMenu } from "./user-menu"

interface SidebarShellProps {
    children: React.ReactNode
}

export function SidebarShell({ children }: SidebarShellProps) {
    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-transparent hover:text-sidebar-foreground disabled:opacity-100"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                                <img src="/gradeloop_logo.png" alt="Gradeloop Logo" className="size-full object-contain" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-bold font-[family-name:var(--font-red-hat-display)] text-xl">Gradeloop</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                {children}
            </SidebarContent>
            <SidebarFooter>
                <UserMenu />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
