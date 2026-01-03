import { AssignmentFlow } from "@/features/instructor/components/assignment-flow/assignment-flow";

interface PageProps {
    params: Promise<{
        id: string;
        assignmentId: string;
    }>;
}

export default async function AssignmentManagePage({ params }: PageProps) {
    const { id, assignmentId } = await params;
    return <AssignmentFlow courseId={id} assignmentId={assignmentId} />;
}
