"use client";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "../../components/ui/sidebar";
import { InstructorSidebar } from "../../components/shared/sidebars/instructor-sidebar";
import { StudentSidebar } from "../../components/shared/sidebars/student-sidebar";
import { SystemAdminSidebar } from "../../components/shared/sidebars/system-admin-sidebar";
import { InstituteAdminSidebar } from "../../components/shared/sidebars/institute-admin-sidebar";
import { InstructorCourseSidebar, StudentCourseSidebar } from "../../components/shared/sidebars/course-sidebar";
import { AssignmentSidebar } from "../../components/shared/sidebars/assignment-sidebar";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const segments = pathname.split('/');
    const isAssignmentWorkspace = segments.includes('assignments') && segments.length > segments.indexOf('assignments') + 1;
    const isInstructor = pathname.startsWith("/instructor");

    const getSidebar = () => {
        if (isAssignmentWorkspace && isInstructor) return <AssignmentSidebar />;
        if (pathname.startsWith("/instructor/courses")) return <InstructorCourseSidebar />;
        if (pathname.startsWith("/student/courses")) return <StudentCourseSidebar />;
        if (pathname.startsWith("/instructor")) return <InstructorSidebar />;
        if (pathname.startsWith("/student")) return <StudentSidebar />;
        if (pathname.startsWith("/system-admin")) return <SystemAdminSidebar />;
        if (pathname.startsWith("/institute-admin")) return <InstituteAdminSidebar />;
        return <InstructorSidebar />; // Default to instructor for now
    };

    const showSidebar = !isAssignmentWorkspace || isInstructor;

    return (
        <SidebarProvider>
            {showSidebar && getSidebar()}
            <SidebarInset className="overflow-hidden">
                <div className={cn(
                    "relative flex flex-1 flex-col bg-background overflow-hidden",
                    showSidebar ? "p-4 lg:p-8" : "p-0"
                )}>
                    {showSidebar && (
                        <SidebarTrigger className="fixed left-4 top-4 z-50 rounded-none border bg-background shadow-md transition-all hover:bg-accent md:hidden group-data-[state=collapsed]:md:flex" />
                    )}
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
