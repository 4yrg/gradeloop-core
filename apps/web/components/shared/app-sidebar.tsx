'use client';

import { usePathname } from "next/navigation";
import { SystemAdminSidebar } from "./sidebars/system-admin-sidebar";
import { InstituteAdminSidebar } from "./sidebars/institute-admin-sidebar";
import { InstructorSidebar } from "./sidebars/instructor-sidebar";
import { StudentSidebar } from "./sidebars/student-sidebar";
import { SidebarShell } from "./sidebars/sidebar-shell";

export function AppSidebar() {
    const pathname = usePathname();

    if (pathname.startsWith("/system-admin")) {
        return <SystemAdminSidebar />;
    }

    if (pathname.startsWith("/institute-admin")) {
        return <InstituteAdminSidebar />;
    }

    if (pathname.startsWith("/instructor")) {
        return <InstructorSidebar />;
    }

    if (pathname.startsWith("/student")) {
        return <StudentSidebar />;
    }

    // Default or fallback
    return <SystemAdminSidebar />;
}
}
