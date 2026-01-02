'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Settings,
    GraduationCap,
    Building2,
    LogOut,
    Menu,
    X
} from "lucide-react";
import { useState } from "react";

const sidebarItems = [
    {
        title: "Overview",
        href: "/dashboard", // Placeholder generic link
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
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed left-4 top-4 z-50 bg-white p-2 text-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-zinc-800 lg:hidden"
            >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Sidebar Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-zinc-200 bg-white transition-transform dark:border-zinc-800 dark:bg-zinc-950 lg:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-16 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl text-zinc-900 dark:text-zinc-50">
                        <span className="text-primary">Gradeloop</span>
                    </Link>
                </div>

                <div className="flex flex-col gap-1 p-4">
                    <div className="text-xs font-medium uppercase text-zinc-400 px-2 py-2">
                        Navigation
                    </div>
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors relative",
                                    isActive
                                        ? "text-primary bg-primary/10"
                                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.title}
                                {isActive && (
                                    <motion.div
                                        layoutId="active-nav"
                                        className="absolute left-0 h-full w-1 bg-primary"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>

                <div className="absolute bottom-4 left-0 right-0 p-4">
                    <button className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20">
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}
