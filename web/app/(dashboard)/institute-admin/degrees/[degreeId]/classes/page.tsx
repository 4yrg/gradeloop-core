"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ClassesGrid } from "../../../../../../features/institute-admin/components/classes-grid";
import { ClassModal } from "../../../../../../features/institute-admin/components/class-modal";
import { BulkImportModal } from "../../../../../../features/institute-admin/components/bulk-import-modal";
import { classesService } from "../../../../../../features/institute-admin/api/classes-service";
import { peopleService } from "../../../../../../features/institute-admin/api/people.api";
import { ClassGroup, Person } from "../../../../../../features/institute-admin/types";
import { Button } from "../../../../../../components/ui/button";
import { useUser } from "../../../../../../hooks/use-user";
import { Upload } from "lucide-react";
import { toast } from "sonner";

export default function DegreeClassesPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useUser();
    const degreeId = params.degreeId as string;

    const [classes, setClasses] = useState<ClassGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

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
        if (!user?.instituteId) {
            toast.error("User or Institute ID not found");
            return;
        }

        try {
            // 1. Create the class
            const created = await classesService.createClass(user.instituteId, { ...data, degreeId });

            const finalStudentIds: number[] = [...studentIds.map(id => parseInt(id)).filter(id => !isNaN(id))];

            // 2. Handle imported students
            if (importedStudents.length > 0 && created.id) {
                const studentsToCreate = importedStudents.map(s => ({
                    ...s,
                    instituteId: user.instituteId,
                    role: "student"
                }));
                // Note: backend already checks for existing by email
                const createdResults = await peopleService.bulkCreatePeople("student", studentsToCreate);

                const newIds = createdResults
                    .filter(res => res.id)
                    .map(res => Number(res.id));

                finalStudentIds.push(...newIds);
            }

            // 3. Add all students if any
            if (finalStudentIds.length > 0 && created.id) {
                await classesService.addStudentsToClass(created.id, finalStudentIds);
            }

            toast.success("Class created successfully with assigned students");
            setClasses((prev) => [...prev, { ...created, studentCount: finalStudentIds.length }]);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to create class", error);
            toast.error("Failed to create class or assign students");
        }
    };

    const handleBulkImportClasses = async (data: Partial<Person>[]) => {
        if (!user?.instituteId) return;

        try {
            const classRequests = data.map(item => ({
                name: item.fullName || "Unnamed Class",
                degreeId: degreeId
            }));
            const createdClasses = await classesService.bulkCreateClasses(user.instituteId, classRequests);
            setClasses((prev) => [...prev, ...createdClasses]);
        } catch (error) {
            console.error("Failed to bulk import classes", error);
        }
    };

    const handleClassClick = (classGroup: ClassGroup) => {
        router.push(`/institute-admin/degrees/${degreeId}/classes/${classGroup.id}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Classes</h2>
                    <p className="text-muted-foreground">Manage student cohorts and sections.</p>
                </div>
                <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Bulk Import
                </Button>
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

            <BulkImportModal
                open={isBulkImportOpen}
                onOpenChange={setIsBulkImportOpen}
                onImport={handleBulkImportClasses}
                onDownloadTemplate={() => user?.instituteId && classesService.downloadTemplate(user.instituteId)}
                entityName="Classes"
                templateHeaders={["Name"]}
                mapRow={(row) => ({ fullName: row[0] })}
            />
        </div>
    );
}
