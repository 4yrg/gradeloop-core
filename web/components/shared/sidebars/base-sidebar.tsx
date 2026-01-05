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
} from "../../ui/sidebar";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { UserMenu } from "./user-menu";
import { useSidebar } from "../../ui/sidebar";

interface BaseSidebarProps {
    children: React.ReactNode;
}

export function BaseSidebar({ children }: BaseSidebarProps) {
    const { toggleSidebar, state } = useSidebar();

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                {state === "collapsed" ? (
                    <div className="flex flex-col items-center gap-4 py-2">
                        <button
                            onClick={toggleSidebar}
                            className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-md transition-colors"
                        >
                            <PanelLeftOpen className="h-5 w-5" />
                        </button>
                        <div className="flex aspect-square size-8 items-center justify-center text-sidebar-primary-foreground text-primary border rounded-lg overflow-hidden shrink-0">
                            <img src="/gradeloop_logo.png" alt="Gradeloop Logo" className="size-full object-contain" />
                        </div>
                    </div>
                ) : (
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <div className="flex items-center justify-between px-2">
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-transparent hover:text-sidebar-foreground disabled:opacity-100 flex-1"
                                >
                                    <div className="flex aspect-square size-8 items-center justify-center text-sidebar-primary-foreground text-primary border rounded-lg overflow-hidden shrink-0">
                                        <img src="/gradeloop_logo.png" alt="Gradeloop Logo" className="size-full object-contain" />
                                    </div>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-bold text-xl ml-2">Gradeloop</span>
                                    </div>
                                </SidebarMenuButton>
                                <button
                                    onClick={toggleSidebar}
                                    className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden shrink-0"
                                >
                                    <PanelLeftClose className="h-5 w-5" />
                                </button>
                            </div>
                        </SidebarMenuItem>
                    </SidebarMenu>
                )}
            </SidebarHeader>
            <SidebarContent>
                {children}
            </SidebarContent>
            <SidebarFooter className="border-t">
                <UserMenu />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
