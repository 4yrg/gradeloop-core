'use client';

import { useSession } from "next-auth/react";
import { SystemAdminSidebar } from "./sidebars/system-admin-sidebar";
import { InstituteAdminSidebar } from "./sidebars/institute-admin-sidebar";
import { InstructorSidebar } from "./sidebars/instructor-sidebar";
import { StudentSidebar } from "./sidebars/student-sidebar";
import { SidebarShell } from "./sidebars/sidebar-shell";

import { useAuthStore } from "@/store/use-auth-store";

export function AppSidebar() {
    const { data: session, status } = useSession();
    const { actingRole } = useAuthStore();
    const userRole = actingRole || session?.user?.role;

    if (status === "loading") {
        return <SidebarShell><div>Loading...</div></SidebarShell>;
    }

    switch (userRole) {
        case "SYSTEM_ADMIN":
            return <SystemAdminSidebar />;
        case "INSTITUTE_ADMIN":
            return <InstituteAdminSidebar />;
        case "INSTRUCTOR":
            return <InstructorSidebar />;
        case "STUDENT":
            return <StudentSidebar />;
        default:
            return <SidebarShell><div>No access ({userRole})</div></SidebarShell>;
    }
}
