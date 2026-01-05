"use client";

import { useEffect, useState } from "react";
import { Upload, Plus } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { PeopleList } from "../../../../features/institute-admin/components/people-list";
import { PersonModal } from "../../../../features/institute-admin/components/person-modal";
import { BulkImportModal } from "../../../../features/institute-admin/components/bulk-import-modal";
import { peopleService } from "../../../../features/institute-admin/api/people-service";
import { Person, UserRole } from "../../../../features/institute-admin/types";

export default function PeoplePage() {
    const [people, setPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Person | null>(null);

    useEffect(() => {
        loadPeople();
    }, []);

    const loadPeople = async () => {
        try {
            setLoading(true);
            const data = await peopleService.getPeople();
            setPeople(data);
        } catch (error) {
            console.error("Failed to load people", error);
        } finally {
            setLoading(false);
        }
    };

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
            await peopleService.deletePerson(id);
            setPeople((prev) => prev.filter((p) => p.id !== id));
        }
    };

    const handleSubmit = async (data: Person) => {
        try {
            if (editingPerson && editingPerson.id) {
                const updated = await peopleService.updatePerson(editingPerson.id, data);
                setPeople((prev) =>
                    prev.map((p) => (p.id === updated.id ? updated : p))
                );
            } else {
                const created = await peopleService.createPerson(data);
                setPeople((prev) => [...prev, created]);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to save person", error);
        }
    };

    const handleBulkImport = async (data: Person[]) => {
        try {
            const created = await peopleService.bulkCreatePeople(data);
            setPeople((prev) => [...prev, ...created]);
        } catch (error) {
            console.error("Failed to bulk create people", error);
            throw error; // Re-throw to let modal handle error state
        }
    };

    const mapCsvRowToPerson = (row: string[]): Person | null => {
        // Expected: firstName, lastName, email, role, studentId
        if (row.length < 3) return null; // Minimal check

        return {
            firstName: row[0],
            lastName: row[1],
            email: row[2],
            role: (row[3] as UserRole) || "student",
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
                        New Person
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading people...</div>
            ) : (
                <PeopleList
                    data={people}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

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
                entityName="People"
                templateHeaders={["First Name", "Last Name", "Email", "Role", "Student ID"]}
                mapRow={mapCsvRowToPerson}
            />
        </div>
    );
}
