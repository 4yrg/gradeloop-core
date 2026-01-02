'use client';

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Settings,
    GraduationCap,
    Building2,
    LogOut,
} from "lucide-react";

const sidebarItems = [
    {
        title: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "System Admin",
        href: "/system-admin",
        icon: Settings,
    },
    {
        title: "Institute Admin",
        href: "/institute-admin",
        icon: Building2,
    },
    {
        title: "Instructor",
        href: "/instructor",
        icon: BookOpen,
    },
    {
        title: "Student",
        href: "/student",
        icon: GraduationCap,
    },
    {
        title: "Users",
        href: "/users",
        icon: Users,
    },
];

export function AppSidebar() {
    const pathname = usePathname();

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
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {sidebarItems.map((item) => (
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
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                            <LogOut />
                            <span>Sign Out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
