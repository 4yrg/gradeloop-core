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
    useDeletePerson
} from "../../../../features/institute-admin/hooks/use-people";

export default function PeoplePage() {
    const [activeTab, setActiveTab] = useState<"student" | "instructor">("student");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Person | null>(null);

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
            deleteMutation.mutate(id, {
                onSuccess: () => toast.success("Person deleted successfully"),
                onError: () => toast.error("Failed to delete person")
            });
        }
    };

    const handleSubmit = async (data: Person) => {
        // Ensure role matches active tab if not strictly set, or trust the modal
        const personData = { ...data, role: data.role || activeTab };

        if (editingPerson && editingPerson.id) {
            updateMutation.mutate({ id: editingPerson.id, data: personData }, {
                onSuccess: () => {
                    toast.success("Person updated successfully");
                    setIsModalOpen(false);
                },
                onError: () => toast.error("Failed to update person")
            });
        } else {
            // Remove ID if present and inject instituteId
            const { id, ...createData } = personData;
            // TODO: dynamic instituteId
            (createData as any).instituteId = "123e4567-e89b-12d3-a456-426614174000";

            createMutation.mutate(createData, {
                onSuccess: () => {
                    toast.success("Person created successfully");
                    setIsModalOpen(false);
                },
                onError: () => toast.error("Failed to create person")
            });
        }
    };

    const handleBulkImport = async (data: Person[]) => {
        // Bulk import logic would need a corresponding mutation or service method.
        // For now, let's log or stub it as the request focused on basic CRUD integration first.
        console.warn("Bulk import not fully integrated yet");
        toast.info("Bulk import coming soon");
        setIsImportModalOpen(false);
        /*
        try {
            const created = await peopleService.bulkCreatePeople(data);
            setPeople((prev) => [...prev, ...created]);
        } catch (error) {
            console.error("Failed to bulk create people", error);
            throw error;
        }
        */
    };

    const mapCsvRowToPerson = (row: string[]): Person | null => {
        if (row.length < 3) return null;
        return {
            firstName: row[0],
            lastName: row[1],
            email: row[2],
            role: (row[3] as UserRole) || activeTab,
            studentId: row[4] || "",
        } as Person;
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
                templateHeaders={["First Name", "Last Name", "Email", "Role", "Student ID"]}
                mapRow={mapCsvRowToPerson}
            />
        </div>
    );
}
