"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DegreesGrid } from "../../../../features/institute-admin/components/degrees-grid";
import { DegreeModal } from "../../../../features/institute-admin/components/degree-modal";
import { ManageCoursesDialog } from "../../../../features/institute-admin/components/manage-courses-dialog";
import { Degree } from "../../../../features/institute-admin/types";
import {
    useDegrees,
    useCreateDegree,
    useUpdateDegree,
    useDeleteDegree,
    useDegreeCourses,
    useAddCourseToDegree,
    useRemoveCourseFromDegree
} from "../../../../features/institute-admin/hooks/use-degrees";
import { useCourses } from "../../../../features/institute-admin/hooks/use-courses";

export default function DegreesPage() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isManageCoursesOpen, setIsManageCoursesOpen] = useState(false);
    const [editingDegree, setEditingDegree] = useState<Degree | null>(null);
    const [managingDegree, setManagingDegree] = useState<Degree | null>(null);

    // Data fetching
    const { data: degrees = [], isLoading } = useDegrees();
    const { data: courses = [] } = useCourses();
    const { data: degreeCourses = [] } = useDegreeCourses(managingDegree?.id || null);

    // Mutations
    const createMutation = useCreateDegree();
    const updateMutation = useUpdateDegree();
    const deleteMutation = useDeleteDegree();
    const addCourseMutation = useAddCourseToDegree();
    const removeCourseMutation = useRemoveCourseFromDegree();

    const handleCreate = () => {
        setEditingDegree(null);
        setIsModalOpen(true);
    };

    const handleEdit = (degree: Degree) => {
        setEditingDegree(degree);
        setIsModalOpen(true);
    };

    const handleDegreeClick = (degree: Degree) => {
        if (degree.id) {
            router.push(`/institute-admin/degrees/${degree.id}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this degree?")) {
            deleteMutation.mutate(id, {
                onSuccess: () => toast.success("Degree deleted"),
                onError: () => toast.error("Failed to delete degree"),
            });
        }
    };

    const handleManageCourses = (degree: Degree) => {
        setManagingDegree(degree);
        setIsManageCoursesOpen(true);
    };

    const handleSubmit = async (data: Degree) => {
        if (editingDegree && editingDegree.id) {
            updateMutation.mutate({ id: editingDegree.id, data }, {
                onSuccess: () => {
                    toast.success("Degree updated");
                    setIsModalOpen(false);
                },
                onError: () => toast.error("Failed to update degree"),
            });
        } else {
            const { id, ...createData } = data;
            createMutation.mutate(createData, {
                onSuccess: () => {
                    toast.success("Degree created");
                    setIsModalOpen(false);
                },
                onError: () => toast.error("Failed to create degree"),
            });
        }
    };

    const handleSaveCourses = async (selectedIds: string[]) => {
        if (!managingDegree || !managingDegree.id) return;

        const currentIds = degreeCourses.map(c => c.id);
        const toAdd = selectedIds.filter(id => !currentIds.includes(id));
        const toRemove = currentIds.filter(id => !selectedIds.includes(id) && id); // Ensure id exists

        // We can use Promise.allSettled to better handle partial failures, but for now simple Promise.all
        // Note: react-query mutation is async
        try {
            await Promise.all([
                ...toAdd.map(id => addCourseMutation.mutateAsync({ degreeId: managingDegree.id!, courseId: id })),
                ...toRemove.map(id => removeCourseMutation.mutateAsync({ degreeId: managingDegree.id!, courseId: id! }))
            ]);
            toast.success("Courses updated successfully");
            setIsManageCoursesOpen(false);
        } catch (error) {
            console.error("Failed to update courses", error);
            toast.error("Failed to update courses");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Degrees</h2>
                    <p className="text-muted-foreground">
                        Manage degree programs.
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading degrees...</div>
            ) : (
                <DegreesGrid
                    data={degrees}
                    onDegreeClick={handleDegreeClick}
                    onCreateClick={handleCreate}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onManageCourses={handleManageCourses}
                />
            )}

            <DegreeModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSubmit={handleSubmit}
                initialData={editingDegree}
                key={editingDegree ? editingDegree.id : "new"}
            />

            {managingDegree && (
                <ManageCoursesDialog
                    open={isManageCoursesOpen}
                    onOpenChange={setIsManageCoursesOpen}
                    title={`Manage Courses for ${managingDegree.name}`}
                    availableCourses={courses}
                    initialSelectedIds={degreeCourses.map(c => c.id || "")}
                    onSave={handleSaveCourses}
                />
            )}
        </div>
    );
}
