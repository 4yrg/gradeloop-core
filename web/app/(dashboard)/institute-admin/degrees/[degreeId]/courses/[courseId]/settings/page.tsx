"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2, AlertTriangle, UserPlus, X } from "lucide-react";
import { Button } from "../../../../../../../../components/ui/button";
import { Separator } from "../../../../../../../../components/ui/separator";
import { Input } from "../../../../../../../../components/ui/input";
import { Label } from "../../../../../../../../components/ui/label";
import { Badge } from "../../../../../../../../components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../../../../../../../../components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../../../../../../../components/ui/dialog";
import { coursesService } from "../../../../../../../../features/institute-admin/api/courses-service";
import { peopleService } from "../../../../../../../../features/institute-admin/api/people-service";
import { Course, Person } from "../../../../../../../../features/institute-admin/types";

export default function CourseSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const degreeId = params.degreeId as string;
    const courseId = params.courseId as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [credits, setCredits] = useState(0);

    // Instructors State
    const [allInstructors, setAllInstructors] = useState<Person[]>([]);
    const [assignedInstructorIds, setAssignedInstructorIds] = useState<string[]>([]);
    const [instructorSearchOpen, setInstructorSearchOpen] = useState(false);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteConfirmStep, setDeleteConfirmStep] = useState<1 | 2>(1);

    useEffect(() => {
        if (courseId) {
            loadData();
        }
    }, [courseId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [courseData, peopleData] = await Promise.all([
                coursesService.getCourseById(courseId),
                peopleService.getPeople()
            ]);

            if (courseData) {
                setCourse(courseData);
                setName(courseData.name);
                setCode(courseData.code);
                setCredits(courseData.credits);
                setAssignedInstructorIds(courseData.instructorIds || []);
            }

            setAllInstructors(peopleData.filter(p => p.role === "instructor"));

        } catch (error) {
            console.error("Failed to load course settings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Update basic details
            await coursesService.updateCourse(courseId, { name, code, credits });
            // Update instructors
            await coursesService.assignInstructors(courseId, assignedInstructorIds);

            router.refresh();
        } catch (error) {
            console.error("Failed to update course", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await coursesService.deleteCourse(courseId);
            router.push(`/institute-admin/degrees/${degreeId}/courses`);
        } catch (error) {
            console.error("Failed to delete course", error);
        }
    };

    const toggleInstructor = (id: string) => {
        setAssignedInstructorIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
    if (!course) return <div className="p-8 text-center text-destructive">Course not found.</div>;

    const availableInstructors = allInstructors.filter(i => i.id !== undefined && !assignedInstructorIds.includes(i.id));
    const assignedInstructors = allInstructors.filter(i => i.id !== undefined && assignedInstructorIds.includes(i.id));

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 hover:bg-transparent text-muted-foreground"
                    onClick={() => router.push(`/institute-admin/degrees/${degreeId}/courses/${courseId}`)}
                >
                    <ArrowLeft className="mr-2 h-3 w-3" />
                    Back to Course
                </Button>
            </div>

            <div>
                <h2 className="text-2xl font-bold tracking-tight">Course Settings</h2>
                <p className="text-muted-foreground">Manage curriculum details and teaching staff.</p>
            </div>

            <Separator />

            <form onSubmit={handleUpdate} className="space-y-8">
                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>General Information</CardTitle>
                        <CardDescription>Update course identity and metadata.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Course Code</Label>
                                <Input
                                    id="code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="credits">Credits</Label>
                                <Input
                                    id="credits"
                                    type="number"
                                    min={0}
                                    value={credits}
                                    onChange={(e) => setCredits(Number(e.target.value))}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Course Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                minLength={2}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Instructor Assignment */}
                <Card>
                    <CardHeader>
                        <CardTitle>Teaching Staff</CardTitle>
                        <CardDescription>Assign instructors to this course.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2 mb-4">
                            {assignedInstructors.map(instructor => (
                                <Badge key={instructor.id} variant="secondary" className="pl-2 pr-1 py-1">
                                    {instructor.firstName} {instructor.lastName}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4 ml-2 hover:bg-transparent text-muted-foreground hover:text-destructive"
                                        onClick={() => instructor.id && toggleInstructor(instructor.id)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </Badge>
                            ))}
                            {assignedInstructors.length === 0 && (
                                <span className="text-sm text-muted-foreground italic">No instructors assigned.</span>
                            )}
                        </div>

                        <Dialog open={instructorSearchOpen} onOpenChange={setInstructorSearchOpen}>
                            <Button variant="outline" onClick={() => setInstructorSearchOpen(true)} className="justify-between w-[300px]">
                                <span className="flex items-center">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Assign Instructor
                                </span>
                            </Button>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Assign Instructor</DialogTitle>
                                    <DialogDescription>Select an instructor to assign to this course.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <Input
                                        placeholder="Search instructors..."
                                        className="h-9"
                                    />
                                    <div className="max-h-[300px] overflow-y-auto space-y-1">
                                        {availableInstructors.length === 0 ? (
                                            <p className="text-sm text-center text-muted-foreground py-2">No instructors found.</p>
                                        ) : (
                                            availableInstructors.map((instructor) => (
                                                <Button
                                                    key={instructor.id}
                                                    variant="ghost"
                                                    className="w-full justify-start text-sm font-normal"
                                                    onClick={() => {
                                                        if (instructor.id) toggleInstructor(instructor.id);
                                                        setInstructorSearchOpen(false);
                                                    }}
                                                >
                                                    {instructor.firstName} {instructor.lastName}
                                                </Button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>

            {/* Danger Zone */}
            <Card className="border-destructive/20 bg-destructive/5 mt-8">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription className="text-destructive/80">
                        Irreversible actions for this course.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Deleting this course will remove it from the degree curriculum.
                    </p>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            setDeleteConfirmStep(1);
                            setDeleteModalOpen(true);
                        }}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Course
                    </Button>
                </CardContent>
            </Card>

            {/* Delete Dialog */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            {deleteConfirmStep === 1 ? "Delete Course?" : "Final Confirmation"}
                        </DialogTitle>
                        <DialogDescription>
                            {deleteConfirmStep === 1
                                ? "Are you sure you want to delete this course? This action cannot be undone."
                                : "This is your last chance. Click 'Confirm Delete' to permanently delete this course."}
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
