"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { DegreesGrid } from "@/features/institute-admin/components/degrees-grid";
import { DegreeModal } from "@/features/institute-admin/components/degree-modal";
import { degreesService } from "@/features/institute-admin/api/degrees-service";
import { Degree } from "@/features/institute-admin/types";

export default function DegreesPage() {
    const router = useRouter();
    const [degrees, setDegrees] = useState<Degree[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDegree, setEditingDegree] = useState<Degree | null>(null);

    // Fetch degrees on mount
    useEffect(() => {
        loadDegrees();
    }, []);

    const loadDegrees = async () => {
        try {
            setLoading(true);
            const data = await degreesService.getDegrees();
            setDegrees(data);
        } catch (error) {
            console.error("Failed to load degrees", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingDegree(null);
        setIsModalOpen(true);
    };

    const handleDegreeClick = (degree: Degree) => {
        // Navigates to the detail page (to be implemented)
        // For now, we can keep the "Edit" flow or prepare for navigation.
        // The instructions say "Clicking a Degree card opens a Degree detail page."
        // We haven't built that page yet, so let's route to it.
        if (degree.id) {
            router.push(`/institute-admin/degrees/${degree.id}`);
        }
    };

    const handleSubmit = async (data: Degree) => {
        try {
            if (editingDegree && editingDegree.id) {
                const updated = await degreesService.updateDegree(editingDegree.id, data);
                setDegrees((prev) =>
                    prev.map((d) => (d.id === updated.id ? updated : d))
                );
            } else {
                const created = await degreesService.createDegree(data);
                setDegrees((prev) => [...prev, created]);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to save degree", error);
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

            {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading degrees...</div>
            ) : (
                <DegreesGrid
                    data={degrees}
                    onDegreeClick={handleDegreeClick}
                    onCreateClick={handleCreate}
                />
            )}

            <DegreeModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSubmit={handleSubmit}
                initialData={editingDegree}
                key={editingDegree ? editingDegree.id : "new"} // Force reset on new/edit switch
            />
        </div>
    );
}
