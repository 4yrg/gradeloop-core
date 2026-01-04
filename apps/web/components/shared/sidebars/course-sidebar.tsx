'use client';

import { BaseSidebar } from "./base-sidebar";
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton
} from "@/components/ui/sidebar";
import {
    LayoutDashboard,
    FileText,
    Users,
    Clock,
    Settings,
    UserCircle,
    ArrowLeft,
    Menu
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const courseData = {
    title: "Introduction to programming",
    description: "Lorem ipsum dolor sit amet consectetur adipiscing elit nec.",
    instructor: "John Doe"
};

export function CourseSidebar() {
    const pathname = usePathname();
    const isInstructor = pathname.startsWith("/instructor");
    const roleBase = isInstructor ? "/instructor" : "/student";

    // Extract course ID from pathname
    const segments = pathname.split('/');
    const courseId = segments[3];

    const navItems = isInstructor ? [
        { title: "Dashboard", icon: LayoutDashboard, href: "" },
        { title: "Assignments", icon: FileText, href: "/assignments" },
        { title: "Roster", icon: Users, href: "/roster" },
        { title: "Extension", icon: Clock, href: "/extension" },
    ] : [
        { title: "Overview", icon: LayoutDashboard, href: "" },
        { title: "Assignments", icon: FileText, href: "/assignments" },
        { title: "My Grades", icon: UserCircle, href: "/grades" }, // Placeholder
    ];

    const getHref = (href: string) => {
        return `${roleBase}/courses/${courseId || 'IT1010'}${href}`;
    };

    const isLinkActive = (href: string) => {
        const fullHref = getHref(href);
        if (href === "") {
            return pathname === fullHref;
        }
        return pathname.startsWith(fullHref);
    };

    return (
        <BaseSidebar>
            <SidebarGroup>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild className="mb-4">
                            <Link href={roleBase}>
                                <ArrowLeft className="h-4 w-4" />
                                <span>Back to your courses</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                <SidebarGroupLabel className="h-auto px-2 py-4 flex flex-col items-start gap-2 group-data-[collapsible=icon]:hidden">
                    <span className="text-xl font-bold text-foreground leading-tight">{courseData.title}</span>
                </SidebarGroupLabel>
                <SidebarGroupContent className="px-2 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {courseData.description}
                    </p>
                </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-4">
                <SidebarGroupContent>
                    <SidebarMenu>
                        {navItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isLinkActive(item.href)}
                                    tooltip={item.title}
                                    className="font-bold py-6"
                                >
                                    <Link href={getHref(item.href)}>
                                        <item.icon className="scale-110" />
                                        <span className="text-base">{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-auto">
                <SidebarGroupLabel className="font-bold text-foreground">{isInstructor ? "Instructor" : "Your Instructor"}</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton className="font-bold py-6">
                                <UserCircle className="scale-110" />
                                <span className="text-base">{courseData.instructor}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </BaseSidebar>
    );
}
