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
    Plus,
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
                    <SidebarGroupLabel className="text-zinc-900 font-bold text-lg h-auto py-2 group-data-[collapsible=icon]:hidden">Your Courses</SidebarGroupLabel>
                    <SidebarGroupContent className="group-data-[collapsible=icon]:hidden">
                        <p className="px-2 py-4 text-sm text-zinc-500 leading-relaxed">
                            Lorem ipsum dolor sit amet consectetur adipisicing elit nec, blandit maecenas ad laoreet sodales luctus mauris cubilia, ullamcorper curae massa penatibus erat netus consequat.
                        </p>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation (Role Switcher)</SidebarGroupLabel>
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
            <SidebarFooter className="border-t">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton className="flex items-center gap-2 py-6">
                            <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800">
                                <Users className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                            </div>
                            <div className="flex flex-1 items-center justify-between group-data-[collapsible=icon]:hidden">
                                <span className="font-bold">Account</span>
                                <Plus className="h-4 w-4 rotate-45" />
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
