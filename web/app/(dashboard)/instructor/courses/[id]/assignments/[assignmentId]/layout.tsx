'use client';

import { AssignmentTopBar } from "@/components/instructor/assignment/assignment-top-bar";
import { useParams } from "next/navigation";
import { mockAssignments } from "@/lib/mock-data";

export default function AssignmentWorkspaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const assignmentId = params.assignmentId as string;

    // In a real app, we'd fetch these from a store or API
    const assignment = mockAssignments.find(a => a.id === assignmentId) || {
        name: "Assignment Title",
        courseName: "Course Name",
        published: false
    };

    return (
        <div className="flex min-h-screen flex-col -m-4 lg:-m-8">
            <AssignmentTopBar
                assignmentName={assignment.name}
                courseName="Introduction to Programming" // Placeholder or fetch from course context
                status={assignment.published ? 'Published' : 'Draft'}
            />
            <main className="flex-1 p-4 lg:p-8 overflow-auto">
                {children}
            </main>
        </div>
    );
}
