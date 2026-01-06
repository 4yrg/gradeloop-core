"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../../components/ui/button";
import { SemestersList } from "../../../../features/institute-admin/components/semesters-list";
import { SemesterModal } from "../../../../features/institute-admin/components/semester-modal";
import { Semester } from "../../../../features/institute-admin/types";
import {
    useSemesters,
    useCreateSemester,
    useUpdateSemester,
    useDeleteSemester,
    useSetActiveSemester
} from "../../../../features/institute-admin/hooks/use-semesters";

export default function SemestersPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSemester, setEditingSemester] = useState<Semester | null>(null);

    // Data fetching
    const { data: semesters = [], isLoading } = useSemesters();

    // Mutations
    const createMutation = useCreateSemester();
    const updateMutation = useUpdateSemester();
    const deleteMutation = useDeleteSemester();
    const setActiveMutation = useSetActiveSemester();

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
            // Remove id for creation if present (though Omit in service handles typings, runtime object might have it if not careful)
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
                />
            )}

            <SemesterModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSubmit={handleSubmit}
                initialData={editingSemester}
                key={editingSemester ? editingSemester.id : "new"}
            />
        </div>
    );
}
