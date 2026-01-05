"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ClassesGrid } from "../../../../../../features/institute-admin/components/classes-grid";
import { ClassModal } from "../../../../../../features/institute-admin/components/class-modal";
import { classesService } from "../../../../../../features/institute-admin/api/classes-service";
import { ClassGroup, Person } from "../../../../../../features/institute-admin/types";
import { Button } from "../../../../../../components/ui/button";

export default function DegreeClassesPage() {
    const params = useParams();
    const router = useRouter();
    const degreeId = params.degreeId as string;

    const [classes, setClasses] = useState<ClassGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
        setIsModalOpen(true);
    };

    const handleSubmit = async (data: ClassGroup, studentIds: string[], importedStudents: Partial<Person>[]) => {
        try {
            const created = await classesService.createClass(data);

            const promises = [];

            if (studentIds.length > 0 && created.id) {
                promises.push(classesService.addStudentsToClass(created.id, studentIds));
            }

            if (importedStudents.length > 0 && created.id) {
                promises.push(classesService.importStudents(created.id, importedStudents));
            }

            if (promises.length > 0) {
                await Promise.all(promises);
                // Update local count
                created.studentCount = studentIds.length + importedStudents.length;
            }

            setClasses((prev) => [...prev, created]);
        } catch (error) {
            console.error("Failed to create class", error);
        }
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

            <ClassModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSubmit={handleSubmit}
                degreeId={degreeId}
            />
        </div>
    );
}
