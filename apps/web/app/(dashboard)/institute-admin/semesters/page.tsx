"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SemestersList } from "@/features/institute-admin/components/semesters-list";
import { SemesterModal } from "@/features/institute-admin/components/semester-modal";
import { semestersService } from "@/features/institute-admin/api/semesters-service";
import { Semester } from "@/features/institute-admin/types";

export default function SemestersPage() {
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSemester, setEditingSemester] = useState<Semester | null>(null);

    useEffect(() => {
        loadSemesters();
    }, []);

    const loadSemesters = async () => {
        try {
            setLoading(true);
            const data = await semestersService.getSemesters();
            // Sort by year descending, then term logic if needed
            setSemesters(data.sort((a, b) => b.year - a.year));
        } catch (error) {
            console.error("Failed to load semesters", error);
        } finally {
            setLoading(false);
        }
    };

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
            await semestersService.deleteSemester(id);
            setSemesters((prev) => prev.filter((s) => s.id !== id));
        }
    };

    const handleSetActive = async (id: string) => {
        await semestersService.setActiveSemester(id);
        // Optimistic update
        setSemesters((prev) => prev.map(s => ({
            ...s,
            isActive: s.id === id
        })));
    };

    const handleSubmit = async (data: Semester) => {
        try {
            if (editingSemester && editingSemester.id) {
                const updated = await semestersService.updateSemester(editingSemester.id, data);
                setSemesters((prev) =>
                    prev.map((s) => (s.id === updated.id ? updated : s))
                );
            } else {
                const created = await semestersService.createSemester(data);
                setSemesters((prev) => [created, ...prev]);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to save semester", error);
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

            {loading ? (
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
