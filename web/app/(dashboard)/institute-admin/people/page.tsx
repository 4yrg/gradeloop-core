"use client";

import { useState } from "react";
import { Upload, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { PeopleList } from "../../../../features/institute-admin/components/people-list";
import { PersonModal } from "../../../../features/institute-admin/components/person-modal";
import { BulkImportModal } from "../../../../features/institute-admin/components/bulk-import-modal";
import { Person, UserRole } from "../../../../features/institute-admin/types";
import {
    usePeople,
    useCreatePerson,
    useUpdatePerson,
    useDeletePerson,
    useBulkCreatePeople
} from "../../../../features/institute-admin/hooks/use-people";
import { peopleService } from "../../../../features/institute-admin/api/people.api";
import { useUser } from "../../../../hooks/use-user";

export default function PeoplePage() {
    const [activeTab, setActiveTab] = useState<"student" | "instructor">("student");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Person | null>(null);
    const { user } = useUser();
    const instituteId = user?.instituteId;

    // Data Fetching
    const { data: allPeople = [], isLoading } = usePeople(activeTab);

    // Client-side filtering fallback (in case backend ignores role param)
    const people = allPeople.filter(p => p.role === activeTab);

    // Mutations
    const createMutation = useCreatePerson();
    const updateMutation = useUpdatePerson();
    const deleteMutation = useDeletePerson();

    const handleCreate = () => {
        setEditingPerson(null);
        setIsModalOpen(true);
    };

    const handleEdit = (person: Person) => {
        setEditingPerson(person);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this person?")) {
            deleteMutation.mutate({ id, role: activeTab }, {
                onSuccess: () => toast.success("Person deleted successfully"),
                onError: () => toast.error("Failed to delete person")
            });
        }
    };

    const handleSubmit = async (data: Person) => {
        // Ensure role matches active tab if not strictly set, or trust the modal
        const personData = { ...data, role: data.role || activeTab };

        if (editingPerson && editingPerson.id) {
            updateMutation.mutate({ id: editingPerson.id, role: editingPerson.role, data: personData }, {
                onSuccess: () => {
                    toast.success("Person updated successfully");
                    setIsModalOpen(false);
                },
                onError: () => toast.error("Failed to update person")
            });
        } else {
            // Remove ID if present and inject instituteId
            const { id, ...createData } = personData;
            (createData as any).instituteId = instituteId;

            createMutation.mutate(createData, {
                onSuccess: () => {
                    toast.success("Person created successfully");
                    setIsModalOpen(false);
                },
                onError: () => toast.error("Failed to create person")
            });
        }
    };

    const bulkCreateMutation = useBulkCreatePeople();

    const handleBulkImport = async (data: Person[]) => {
        bulkCreateMutation.mutate({ role: activeTab, data }, {
            onSuccess: () => {
                toast.success(`Successfully imported ${data.length} ${activeTab}s`);
                setIsImportModalOpen(false);
            },
            onError: () => toast.error("Failed to import people")
        });
    };

    const mapCsvRowToPerson = (row: string[]): Person | null => {
        if (row.length < 2) return null;
        if (activeTab === 'student') {
            return {
                fullName: row[0],
                email: row[1],
                instituteId: instituteId,
                role: "student"
            } as Person;
        } else {
            return {
                fullName: row[0],
                email: row[1],
                instituteId: instituteId,
                department: row[2] || "",
                role: "instructor"
            } as Person;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">People</h2>
                    <p className="text-muted-foreground">
                        Manage admins, instructors, and students.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Bulk Import
                    </Button>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        New {activeTab === "student" ? "Student" : "Instructor"}
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList>
                    <TabsTrigger value="student">Students</TabsTrigger>
                    <TabsTrigger value="instructor">Instructors</TabsTrigger>
                </TabsList>

                <TabsContent value="student" className="mt-4">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading students...</div>
                    ) : (
                        <PeopleList
                            data={people}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    )}
                </TabsContent>
                <TabsContent value="instructor" className="mt-4">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading instructors...</div>
                    ) : (
                        <PeopleList
                            data={people}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    )}
                </TabsContent>
            </Tabs>

            <PersonModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSubmit={handleSubmit}
                initialData={editingPerson}
                key={editingPerson ? editingPerson.id : "new"}
            />

            <BulkImportModal
                open={isImportModalOpen}
                onOpenChange={setIsImportModalOpen}
                onImport={handleBulkImport}
                entityName={activeTab === 'student' ? "Students" : "Instructors"}
                templateHeaders={activeTab === 'student'
                    ? ["Full Name", "Email"]
                    : ["Full Name", "Email", "Department"]
                }
                mapRow={mapCsvRowToPerson}
                onDownloadTemplate={() => peopleService.downloadTemplate(activeTab)}
            />
        </div>
    );
}
