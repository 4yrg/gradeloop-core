"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ClassesGrid } from "@/features/institute-admin/components/classes-grid";
import { classesService } from "@/features/institute-admin/api/classes-service";
import { ClassGroup } from "@/features/institute-admin/types";
import { Button } from "@/components/ui/button";

export default function DegreeClassesPage() {
    const params = useParams();
    const router = useRouter();
    const degreeId = params.degreeId as string;

    const [classes, setClasses] = useState<ClassGroup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (degreeId) {
            loadClasses();
        }
    }, [degreeId]);

    const loadClasses = async () => {
        try {
            setLoading(true);
            const data = await classesService.getClassesForDegree(degreeId);
            setClasses(data);
        } catch (error) {
            console.error("Failed to load classes", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        // For now, just a placeholder alert as per instruction strictness "Implement ONE logical section".
        // The modal logic might be considered part of the "create" UX, but I'll stick to displaying the grid first.
        // Or I can route to a "new" page if that's the pattern?
        // User said "Create Class UX... triggered by clicking... placeholder card".
        // I'll assume a modal is needed but I'll implement a simple stub for now or just log it.
        // Actually, user said "Clicking a class card opens the Class page". 
        // I will navigate.
        alert("Create Class Modal would open here.");
    };

    const handleClassClick = (classGroup: ClassGroup) => {
        router.push(`/institute-admin/degrees/${degreeId}/classes/${classGroup.id}`);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold tracking-tight">Classes</h2>
                <p className="text-muted-foreground">Manage student cohorts and sections.</p>
            </div>

            {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading classes...</div>
            ) : (
                <ClassesGrid
                    data={classes}
                    onClassClick={handleClassClick}
                    onCreateClick={handleCreate}
                />
            )}
        </div>
    );
}
