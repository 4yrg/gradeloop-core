"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { classesService } from "@/features/institute-admin/api/classes-service";
import { ClassGroup } from "@/features/institute-admin/types";

export default function ClassSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const degreeId = params.degreeId as string;
    const classId = params.classId as string;

    const [classData, setClassData] = useState<ClassGroup | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Edit Form State
    const [name, setName] = useState("");

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteConfirmStep, setDeleteConfirmStep] = useState<1 | 2>(1);

    useEffect(() => {
        if (classId) {
            loadData();
        }
    }, [classId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await classesService.getClassById(classId);
            if (data) {
                setClassData(data);
                setName(data.name);
            }
        } catch (error) {
            console.error("Failed to load class settings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!classData) return;

        setSaving(true);
        try {
            await classesService.updateClass(classId, { name });
            router.refresh();
            // Show success toast here usually
        } catch (error) {
            console.error("Failed to update class", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await classesService.deleteClass(classId);
            router.push(`/institute-admin/degrees/${degreeId}/classes`);
        } catch (error) {
            console.error("Failed to delete class", error);
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
    if (!classData) return <div className="p-8 text-center text-destructive">Class not found.</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 hover:bg-transparent text-muted-foreground"
                    onClick={() => router.push(`/institute-admin/degrees/${degreeId}/classes/${classId}`)}
                >
                    <ArrowLeft className="mr-2 h-3 w-3" />
                    Back to Class
                </Button>
            </div>

            <div>
                <h2 className="text-2xl font-bold tracking-tight">Class Settings</h2>
                <p className="text-muted-foreground">Manage class details and danger zone actions.</p>
            </div>

            <Separator />

            {/* General Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>General Information</CardTitle>
                    <CardDescription>Update basic class details.</CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdate}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Class Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                minLength={2}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button type="submit" disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription className="text-destructive/80">
                        Irreversible actions for this class.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Deleting this class will remove all student associations. This action cannot be undone.
                    </p>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            setDeleteConfirmStep(1);
                            setDeleteModalOpen(true);
                        }}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Class
                    </Button>
                </CardContent>
            </Card>

            {/* Delete Dialog */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            {deleteConfirmStep === 1 ? "Delete Class?" : "Final Confirmation"}
                        </DialogTitle>
                        <DialogDescription>
                            {deleteConfirmStep === 1
                                ? "Are you sure you want to delete this class? This will permanently remove the class and unassign all students."
                                : "This is your last chance. Click 'Confirm Delete' to permanently delete this class."}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                        {deleteConfirmStep === 1 ? (
                            <Button variant="destructive" onClick={() => setDeleteConfirmStep(2)}>
                                Proceed to Confirmation
                            </Button>
                        ) : (
                            <Button variant="destructive" onClick={handleDelete}>
                                Confirm Delete
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
