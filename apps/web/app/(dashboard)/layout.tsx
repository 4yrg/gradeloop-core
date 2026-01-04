"use client";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { InstructorSidebar } from "@/components/shared/sidebars/instructor-sidebar";
import { StudentSidebar } from "@/components/shared/sidebars/student-sidebar";
import { SystemAdminSidebar } from "@/components/shared/sidebars/system-admin-sidebar";
import { InstituteAdminSidebar } from "@/components/shared/sidebars/institute-admin-sidebar";
import { CourseSidebar } from "@/components/shared/sidebars/course-sidebar";
import { AssignmentSidebar } from "@/components/shared/sidebars/assignment-sidebar";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const getSidebar = () => {
        const segments = pathname.split('/');
        const isAssignmentWorkspace = segments.includes('assignments') && segments.length > segments.indexOf('assignments') + 1;

        if (isAssignmentWorkspace) return <AssignmentSidebar />;
        if (pathname.startsWith("/instructor/courses")) return <CourseSidebar />;
        if (pathname.startsWith("/instructor")) return <InstructorSidebar />;
        if (pathname.startsWith("/student")) return <StudentSidebar />;
        if (pathname.startsWith("/system-admin")) return <SystemAdminSidebar />;
        if (pathname.startsWith("/institute-admin")) return <InstituteAdminSidebar />;
        return <InstructorSidebar />; // Default to instructor for now
    };

    return (
        <SidebarProvider>
            {getSidebar()}
            <SidebarInset>
                <div className="relative flex flex-1 flex-col bg-background p-4 lg:p-8">
                    <SidebarTrigger className="fixed left-4 top-4 z-50 rounded-none border bg-background shadow-md transition-all hover:bg-accent md:hidden group-data-[state=collapsed]:md:flex" />
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
