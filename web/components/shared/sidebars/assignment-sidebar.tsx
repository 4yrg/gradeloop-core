'use client';

import { BaseSidebar } from "./base-sidebar";
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from "../../ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "../../ui/collapsible";
import {
    LayoutDashboard,
    Wrench,
    FileEdit,
    Cpu,
    Mic,
    Copy,
    ShieldCheck,
    ClipboardCheck,
    Users,
    Zap,
    Star,
    ShieldAlert,
    Binary,
    Flag,
    GitBranch,
    PlayCircle,
    BarChart,
    Settings,
    ChevronRight,
    ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { Badge } from "../../ui/badge";

export function AssignmentSidebar() {
    const pathname = usePathname();
    const params = useParams();
    const assignmentId = params.assignmentId as string;
    const courseId = params.id as string;

    const getHref = (path: string) => {
        return `/instructor/courses/${courseId}/assignments/${assignmentId}${path}`;
    };

    const isActive = (path: string) => {
        const fullPath = getHref(path);
        if (path === "") return pathname === fullPath;
        return pathname.startsWith(fullPath);
    };

    const navGroups = [
        {
            title: "Overview",
            icon: LayoutDashboard,
            href: "",
            enabled: true,
        },
        {
            title: "Design & Structure",
            icon: Wrench,
            enabled: true,
            items: [
                { title: "Edit Outline", icon: FileEdit, href: "/edit-outline" },
                { title: "Autograder", icon: Cpu, href: "/autograder" },
                { title: "Viva", icon: Mic, href: "/viva" },
                { title: "Clone Detector", icon: Copy, href: "/clone-detector" },
                { title: "Integrity & AI Detection", icon: ShieldCheck, href: "/integrity" },
            ],
        },
        {
            title: "Evaluation",
            icon: ClipboardCheck,
            enabled: true, // Should be after publish
            items: [
                {
                    title: "Manage Submissions",
                    icon: Users,
                    href: "/submissions",
                    badge: "12"
                },
                {
                    title: "Autograde Requests",
                    icon: Zap,
                    href: "/autograde-requests",
                    badge: "3"
                },
                { title: "Grade Review", icon: Star, href: "/grade-review" },
            ],
        },
        {
            title: "Review & Integrity",
            icon: ShieldAlert,
            enabled: true, // Should be after first submission
            items: [
                { title: "Review Similarity", icon: Binary, href: "/similarity" },
                {
                    title: "Integrity Flags",
                    icon: Flag,
                    href: "/integrity-flags",
                    badge: "5"
                },
                { title: "Code Lineage", icon: GitBranch, href: "/lineage" },
                { title: "Session Playback", icon: PlayCircle, href: "/playback" },
            ],
        },
        {
            title: "Insights",
            icon: BarChart,
            href: "/insights",
            enabled: true, // Should be after first submission
        },
        {
            title: "Settings",
            icon: Settings,
            href: "/settings",
            enabled: true,
        },
    ];

    return (
        <BaseSidebar>
            <SidebarGroup>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href={`/instructor/courses/${courseId}/assignments`}>
                                <ArrowLeft className="h-4 w-4" />
                                <span>Back to Assignments</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
                <SidebarMenu>
                    {navGroups.map((group) => {
                        if (!group.items) {
                            return (
                                <SidebarMenuItem key={group.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(group.href!)}
                                        tooltip={group.title}
                                        disabled={!group.enabled}
                                    >
                                        <Link href={getHref(group.href!)}>
                                            <group.icon />
                                            <span>{group.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        }

                        return (
                            <Collapsible
                                key={group.title}
                                asChild
                                defaultOpen={group.items.some(item => isActive(item.href))}
                                className="group/collapsible"
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton tooltip={group.title} disabled={!group.enabled}>
                                            <group.icon />
                                            <span>{group.title}</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {group.items.map((item) => (
                                                <SidebarMenuSubItem key={item.title}>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={isActive(item.href)}
                                                    >
                                                        <Link href={getHref(item.href)}>
                                                            <item.icon className="h-4 w-4" />
                                                            <span>{item.title}</span>
                                                            {item.badge && (
                                                                <Badge variant="secondary" className="ml-auto px-1 py-0 text-[10px] h-4">
                                                                    {item.badge}
                                                                </Badge>
                                                            )}
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        );
                    })}
                </SidebarMenu>
            </SidebarGroup>
        </BaseSidebar>
    );
}
