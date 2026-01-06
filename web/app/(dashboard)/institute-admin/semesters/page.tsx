"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../../components/ui/button";
import { SemestersList } from "../../../../features/institute-admin/components/semesters-list";
import { SemesterModal } from "../../../../features/institute-admin/components/semester-modal";
import { ManageCoursesDialog } from "../../../../features/institute-admin/components/manage-courses-dialog";
import { Semester } from "../../../../features/institute-admin/types";
import {
    useSemesters,
    useCreateSemester,
    useUpdateSemester,
    useDeleteSemester,
    useSetActiveSemester,
    useSemesterCourses,
    useAddCourseToSemester,
    useRemoveCourseFromSemester
} from "../../../../features/institute-admin/hooks/use-semesters";
import { useCourses } from "../../../../features/institute-admin/hooks/use-courses";

export default function SemestersPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isManageCoursesOpen, setIsManageCoursesOpen] = useState(false);
    const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
    const [managingSemester, setManagingSemester] = useState<Semester | null>(null);

    // Data fetching
    const { data: semesters = [], isLoading } = useSemesters();
    const { data: courses = [] } = useCourses();
    const { data: semesterCourses = [] } = useSemesterCourses(managingSemester?.id || null);

    // Mutations
    const createMutation = useCreateSemester();
    const updateMutation = useUpdateSemester();
    const deleteMutation = useDeleteSemester();
    const setActiveMutation = useSetActiveSemester();
    const addCourseMutation = useAddCourseToSemester();
    const removeCourseMutation = useRemoveCourseFromSemester();

    const handleCreate = () => {
        setEditingSemester(null);
        setIsModalOpen(true);
    };

    const handleEdit = (semester: Semester) => {
        setEditingSemester(semester);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this semester?")) {
            deleteMutation.mutate(id, {
                onSuccess: () => {
                    toast.success("Semester deleted successfully");
                },
                onError: (error) => {
                    console.error("Failed to delete semester", error);
                    toast.error("Failed to delete semester");
                }
            });
        }
    };

    const handleSetActive = async (id: string) => {
        setActiveMutation.mutate(id, {
            onSuccess: () => {
                toast.success("Semester activated successfully");
            },
            onError: (error) => {
                console.error("Failed to activate semester", error);
                toast.error("Failed to activate semester");
            }
        });
    };

    const handleSubmit = async (data: Semester) => {
        if (editingSemester && editingSemester.id) {
            updateMutation.mutate({ id: editingSemester.id, data }, {
                onSuccess: () => {
                    toast.success("Semester updated successfully");
                    setIsModalOpen(false);
                },
                onError: (error) => {
                    console.error("Failed to update semester", error);
                    toast.error("Failed to update semester");
                }
            });
        } else {
            const { id, ...createData } = data;
            createMutation.mutate(createData, {
                onSuccess: () => {
                    toast.success("Semester created successfully");
                    setIsModalOpen(false);
                },
                onError: (error) => {
                    console.error("Failed to create semester", error);
                    toast.error("Failed to create semester");
                }
            });
        }
    };

    const handleManageCourses = (semester: Semester) => {
        setManagingSemester(semester);
        setIsManageCoursesOpen(true);
    };

    const handleSaveCourses = async (selectedIds: string[]) => {
        if (!managingSemester || !managingSemester.id) return;

        const currentIds = semesterCourses.map((c: any) => c.id);
        const toAdd = selectedIds.filter(id => !currentIds.includes(id));
        const toRemove = currentIds.filter((id: string) => !selectedIds.includes(id) && id);

        try {
            await Promise.all([
                ...toAdd.map(id => addCourseMutation.mutateAsync({ semesterId: managingSemester.id!, courseId: id })),
                ...toRemove.map(id => removeCourseMutation.mutateAsync({ semesterId: managingSemester.id!, courseId: id! }))
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
                    <h2 className="text-2xl font-bold tracking-tight">Semesters</h2>
                    <p className="text-muted-foreground">
                        Manage academic terms and registration periods.
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Semester
                </Button>
            </div>

            {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading semesters...</div>
            ) : (
                <SemestersList
                    data={semesters}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onSetActive={handleSetActive}
                    onManageCourses={handleManageCourses}
                />
            )}

            <SemesterModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSubmit={handleSubmit}
                initialData={editingSemester}
                key={editingSemester ? editingSemester.id : "new"}
            />

            {managingSemester && (
                <ManageCoursesDialog
                    open={isManageCoursesOpen}
                    onOpenChange={setIsManageCoursesOpen}
                    title={`Manage Courses for ${managingSemester.name}`}
                    availableCourses={courses}
                    initialSelectedIds={semesterCourses.map((c: any) => c.id || "")}
                    onSave={handleSaveCourses}
                />
            )}
        </div>
    );
}
