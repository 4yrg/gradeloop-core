"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, Upload, Settings } from "lucide-react";
import { Button } from "../../../../../../../components/ui/button";
import { Separator } from "../../../../../../../components/ui/separator";
import { classesService } from "../../../../../../../features/institute-admin/api/classes-service";
import { peopleService } from "../../../../../../../features/institute-admin/api/people.api";
import { ClassGroup, Person } from "../../../../../../../features/institute-admin/types";
import { StudentListTable } from "../../../../../../../features/institute-admin/components/student-list-table";
import { AddStudentModal } from "../../../../../../../features/institute-admin/components/add-student-modal";
import { BulkImportModal } from "../../../../../../../features/institute-admin/components/bulk-import-modal";
import { useUser } from "../../../../../../../hooks/use-user";
import { toast } from "sonner";

export default function ClassDetailPage() {
    const params = useParams();
    const router = useRouter();
    const degreeId = params.degreeId as string;
    const classId = params.classId as string;

    const [classData, setClassData] = useState<ClassGroup | null>(null);
    const [students, setStudents] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    useEffect(() => {
        if (classId) {
            loadData();
        }
    }, [classId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [cls, stus] = await Promise.all([
                classesService.getClassById(classId),
                classesService.getStudentsForClass(classId)
            ]);

            if (cls) setClassData(cls);
            if (stus) setStudents(stus);
        } catch (error) {
            console.error("Failed to load class details", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveStudent = async (studentId: string) => {
        if (confirm("Are you sure you want to remove this student?")) {
            try {
                await classesService.removeStudentFromClass(classId, studentId);
                // Optimistic update
                setStudents(prev => prev.filter(p => p.id !== studentId));
            } catch (error) {
                console.error("Failed to remove student", error);
            }
        }
    };

    const handleAddStudents = async (studentIds: string[]) => {
        try {
            const numericIds = studentIds.map(id => parseInt(id)).filter(id => !isNaN(id));
            await classesService.addStudentsToClass(classId, numericIds);
            loadData();
            setIsAddModalOpen(false);
        } catch (error) {
            console.error("Failed to add students", error);
        }
    };

    const { user } = useUser();
    const handleImportStudents = async (data: Partial<Person>[]) => {
        if (!user?.instituteId) {
            toast.error("User not found");
            return;
        }

        try {
            // 1. Bulk create students (backend handles existence check)
            const studentsToCreate = data.map(s => ({
                ...s,
                instituteId: user.instituteId,
                role: "student" as const
            }));

            const createdResults = await peopleService.bulkCreatePeople("student", studentsToCreate);
            const studentIds = createdResults
                .filter(res => res.id)
                .map(res => Number(res.id));

            if (studentIds.length > 0) {
                // 2. Assign to class
                await classesService.addStudentsToClass(classId, studentIds);
                toast.success(`Successfully imported ${studentIds.length} students`);
            } else {
                toast.info("No new students were added");
            }

            loadData();
            setIsImportModalOpen(false);
        } catch (error) {
            console.error("Failed to import students", error);
            toast.error("Failed to import students");
        }
    };

    const handleAddStudent = () => {
        setIsAddModalOpen(true);
    };

    const handleImportCSV = () => {
        setIsImportModalOpen(true);
    };

    // CSV Mapping
    const mapCSVRow = (row: string[]): Partial<Person> | null => {
        // Expected: Full Name, Email, Student ID
        if (row.length < 2) return null;
        return {
            fullName: row[0],
            email: row[1],
            studentId: row[2] || "",
            role: "student",
        };
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading specific class details...</div>;
    }

    if (!classData) {
        return <div className="p-8 text-center text-destructive">Class not found.</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 hover:bg-transparent text-muted-foreground"
                            onClick={() => router.push(`/institute-admin/degrees/${degreeId}/classes`)}
                        >
                            <ArrowLeft className="mr-2 h-3 w-3" />
                            Back to Classes
                        </Button>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">{classData.name}</h2>
                    <p className="text-muted-foreground text-sm">
                        {students.length} Students Enrolled
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleImportCSV}>
                        <Upload className="mr-2 h-4 w-4" />
                        Import CSV
                    </Button>
                    <Button size="sm" onClick={handleAddStudent}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Student
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/institute-admin/degrees/${degreeId}/classes/${classId}/settings`)}>
                        <Settings className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Separator />

            {/* Student List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Student Roster</h3>
                </div>

                <StudentListTable
                    data={students}
                    onRemoveStudent={handleRemoveStudent}
                />
            </div>

            <AddStudentModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                currentStudentIds={students.map(s => s.id || "")}
                onAddStudents={handleAddStudents}
            />

            <BulkImportModal
                open={isImportModalOpen}
                onOpenChange={setIsImportModalOpen}
                onImport={handleImportStudents}
                onDownloadTemplate={() => peopleService.downloadTemplate("student")}
                entityName="Students"
                templateHeaders={["Full Name", "Email", "Student ID"]}
                mapRow={mapCSVRow}
            />
        </div>
    );
}
