'use client';

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Share2, MoreHorizontal } from "lucide-react";
import { mockAssignments } from "@/lib/mock-data";

export default function AssignmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id, assignmentId } = params;

    const assignment = mockAssignments.find(a => a.id === assignmentId);

    if (!assignment) {
        return <div className="p-8">Assignment not found.</div>;
    }

    return (
        <div className="flex flex-col gap-8 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{assignment.name}</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="border p-6 bg-muted/20">
                        <h2 className="text-xl font-bold mb-4">Overview</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Status</p>
                                <p className="font-medium">{assignment.published ? 'Published' : 'Draft'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Due Date</p>
                                <p className="font-medium">{assignment.due}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Submissions</p>
                                <p className="font-medium">{assignment.submissions}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Graded</p>
                                <p className="font-medium">{assignment.graded}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border p-8 border-dashed flex flex-col items-center justify-center min-h-[300px] text-muted-foreground">
                        <p>Assignment grading interface and detailed statistics go here.</p>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <Button className="w-full">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Assignment
                    </Button>
                    <Button variant="outline" className="w-full">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Link
                    </Button>
                    <Button variant="ghost" className="w-full">
                        <MoreHorizontal className="h-4 w-4 mr-2" />
                        More Actions
                    </Button>
                </div>
            </div>
        </div>
    );
}
