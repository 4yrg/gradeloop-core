'use client';

import * as React from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import { Users, PanelLeftClose, PanelLeftOpen, ChevronUp, UserCircle } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

interface BaseSidebarProps {
    children: React.ReactNode;
}

export function BaseSidebar({ children }: BaseSidebarProps) {
    const { toggleSidebar, state } = useSidebar();

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center justify-between px-2">
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-transparent hover:text-sidebar-foreground disabled:opacity-100 flex-1"
                            >
                                <div className="flex aspect-square size-8 items-center justify-center text-sidebar-primary-foreground text-primary border">
                                    <img src="/gradeloop_logo.png" alt="Gradeloop Logo" className="size-full object-contain" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                    <span className="truncate font-bold text-xl">Gradeloop</span>
                                </div>
                            </SidebarMenuButton>
                            <button
                                onClick={toggleSidebar}
                                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden"
                            >
                                {state === "expanded" ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
                            </button>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                {children}
            </SidebarContent>
            <SidebarFooter className="border-t">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton className="flex items-center gap-2 py-6">
                            <div className="flex aspect-square size-8 items-center justify-center bg-muted border">
                                <UserCircle className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex flex-1 items-center justify-between group-data-[collapsible=icon]:hidden">
                                <span className="font-bold text-base">Account</span>
                                <ChevronUp className="h-4 w-4" />
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
