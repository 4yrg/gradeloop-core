"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Settings, Library, Users, Plus, Trash2, Upload, Star } from "lucide-react";
import { Button } from "../../../../../../../components/ui/button";
import { Separator } from "../../../../../../../components/ui/separator";
import { coursesService } from "../../../../../../../features/institute-admin/api/courses-service";
import { peopleService } from "../../../../../../../features/institute-admin/api/people-service";
import { Course, ClassGroup, Person } from "../../../../../../../features/institute-admin/types";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../../../../../../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../../../../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../../../../components/ui/avatar";
import { Badge } from "../../../../../../../components/ui/badge";
import { AddClassModal } from "../../../../../../../features/institute-admin/components/add-class-modal";
import { AddInstructorModal } from "../../../../../../../features/institute-admin/components/add-instructor-modal";
import { BulkImportModal } from "../../../../../../../features/institute-admin/components/bulk-import-modal";

export default function CourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const degreeId = params.degreeId as string;
    const courseId = params.courseId as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [classes, setClasses] = useState<ClassGroup[]>([]);
    const [instructors, setInstructors] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
    const [isAddInstructorModalOpen, setIsAddInstructorModalOpen] = useState(false);
    const [isImportInstructorModalOpen, setIsImportInstructorModalOpen] = useState(false);

    useEffect(() => {
        if (courseId) {
            loadData();
        }
    }, [courseId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [courseData, classesData, allPeople] = await Promise.all([
                coursesService.getCourseById(courseId),
                coursesService.getClassesForCourse(courseId),
                peopleService.getPeople()
            ]);

            if (courseData) {
                setCourse(courseData);
                // Filter instructors based on IDs stored in course
                if (courseData.instructorIds) {
                    const courseInstructors = allPeople.filter(p => courseData.instructorIds?.includes(p.id || ""));
                    setInstructors(courseInstructors);
                } else {
                    setInstructors([]);
                }
            }
            if (classesData) setClasses(classesData);
        } catch (error) {
            console.error("Failed to load course details", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Class Actions ---

    const handleAddClasses = async (classIds: string[]) => {
        try {
            await coursesService.addClassesToCourse(courseId, classIds);
            loadData();
        } catch (error) {
            console.error("Failed to add classes", error);
        }
    };

    const handleRemoveClass = async (classId: string) => {
        if (confirm("Are you sure you want to remove this class from the course?")) {
            try {
                await coursesService.removeClassFromCourse(courseId, classId);
                setClasses(prev => prev.filter(c => c.id !== classId));
            } catch (error) {
                console.error("Failed to remove class", error);
            }
        }
    };

    // --- Instructor Actions ---

    const handleAddInstructors = async (ids: string[]) => {
        try {
            const newIds = [...(course?.instructorIds || []), ...ids];
            // Remove duplicates
            const uniqueIds = Array.from(new Set(newIds));
            await coursesService.assignInstructors(courseId, uniqueIds);
            loadData();
        } catch (error) {
            console.error("Failed to add instructors", error);
        }
    };

    const handleRemoveInstructor = async (instructorId: string) => {
        if (confirm("Are you sure you want to remove this instructor?")) {
            try {
                // Remove from local list optimistcally or refetch
                const newIds = (course?.instructorIds || []).filter(id => id !== instructorId);
                await coursesService.assignInstructors(courseId, newIds);

                // If the removed instructor was the Module Leader, unset it
                if (course?.moduleLeaderId === instructorId) {
                    await coursesService.setModuleLeader(courseId, "");
                }
                loadData();
            } catch (error) {
                console.error("Failed to remove instructor", error);
            }
        }
    };

    const handleSetModuleLeader = async (instructorId: string) => {
        if (course?.moduleLeaderId && course.moduleLeaderId !== instructorId) {
            if (!confirm("This will replace the current Module Leader. Continue?")) return;
        }
        try {
            await coursesService.setModuleLeader(courseId, instructorId);
            // Optimistic update
            setCourse(prev => prev ? ({ ...prev, moduleLeaderId: instructorId }) : null);
        } catch (error) {
            console.error("Failed to set leader", error);
        }
    };

    const handleImportInstructors = async (importedData: any[]) => {
        alert(`Imported ${importedData.length} instructors (Mock).`);
        setIsImportInstructorModalOpen(false);
    };

    // CSV Mapping
    const mapCSVRow = (row: any): Partial<Person> => ({
        firstName: row["First Name"],
        lastName: row["Last Name"],
        email: row["Email"],
        role: "instructor"
    });


    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading course details...</div>;
    if (!course) return <div className="p-8 text-center text-destructive">Course not found.</div>;

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
                            onClick={() => router.push(`/institute-admin/degrees/${degreeId}/courses`)}
                        >
                            <ArrowLeft className="mr-2 h-3 w-3" />
                            Back to Courses
                        </Button>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">{course.name}</h2>
                    <p className="text-muted-foreground text-sm">
                        {course.code} • {course.credits} Credits • {course.semester}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/institute-admin/degrees/${degreeId}/courses/${courseId}/settings`)}
                    >
                        <Settings className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Separator />

            <Tabs defaultValue="classes" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="classes" className="flex items-center gap-2">
                        <Library className="h-4 w-4" />
                        Enrolled Classes
                    </TabsTrigger>
                    <TabsTrigger value="instructors" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Instructors
                    </TabsTrigger>
                </TabsList>

                {/* Classes Tab */}
                <TabsContent value="classes" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Classes</h3>
                        <Button size="sm" onClick={() => setIsAddClassModalOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Class
                        </Button>
                    </div>

                    {classes.length === 0 ? (
                        <div className="text-center py-12 border border-dashed rounded-lg text-muted-foreground">
                            No classes enrolled in this course yet.
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {classes.map((cls) => (
                                <Card key={cls.id} className="relative group overflow-hidden transition-all hover:shadow-md">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/70" />
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">{cls.name}</CardTitle>
                                        <CardDescription>{cls.studentCount} Students</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pb-2">
                                        {/* Footer actions or info could go here */}
                                    </CardContent>
                                    <CardFooter className="flex justify-end pt-0 pb-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={() => cls.id && handleRemoveClass(cls.id)}
                                        >
                                            <Trash2 className="mr-2 h-3 w-3" />
                                            Remove
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Instructors Tab */}
                <TabsContent value="instructors" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Teaching Staff</h3>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => setIsImportInstructorModalOpen(true)}>
                                <Upload className="mr-2 h-4 w-4" />
                                Import
                            </Button>
                            <Button size="sm" onClick={() => setIsAddInstructorModalOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Instructor
                            </Button>
                        </div>
                    </div>

                    {instructors.length === 0 ? (
                        <div className="text-center py-12 border border-dashed rounded-lg text-muted-foreground">
                            No instructors assigned to this course.
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {instructors.map((instructor) => {
                                const isLeader = instructor.id === course.moduleLeaderId;
                                return (
                                    <Card key={instructor.id} className="text-center pt-6 relative group">
                                        {isLeader && (
                                            <div className="absolute top-2 right-2">
                                                <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-white border-0">
                                                    <Star className="w-3 h-3 fill-current mr-1" />
                                                    Leader
                                                </Badge>
                                            </div>
                                        )}

                                        <CardContent className="space-y-4">
                                            <div className="flex justify-center">
                                                <Avatar className="h-24 w-24">
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${instructor.firstName} ${instructor.lastName}`} />
                                                    <AvatarFallback className="text-xl">{instructor.firstName[0]}{instructor.lastName[0]}</AvatarFallback>
                                                </Avatar>
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-semibold text-lg">{instructor.firstName} {instructor.lastName}</h4>
                                                <p className="text-sm text-muted-foreground break-all">{instructor.email}</p>
                                            </div>

                                            <div className="pt-2 flex justify-center gap-2">
                                                {!isLeader && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        title="Set as Module Leader"
                                                        onClick={() => instructor.id && handleSetModuleLeader(instructor.id)}
                                                    >
                                                        <Star className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => instructor.id && handleRemoveInstructor(instructor.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <AddClassModal
                open={isAddClassModalOpen}
                onOpenChange={setIsAddClassModalOpen}
                courseId={courseId}
                degreeId={degreeId}
                currentClassIds={classes.map(c => c.id || "")}
                onAddClasses={handleAddClasses}
            />

            <AddInstructorModal
                open={isAddInstructorModalOpen}
                onOpenChange={setIsAddInstructorModalOpen}
                currentInstructorIds={course.instructorIds || []}
                onAddInstructors={handleAddInstructors}
            />

            <BulkImportModal
                open={isImportInstructorModalOpen}
                onOpenChange={setIsImportInstructorModalOpen}
                onImport={handleImportInstructors}
                entityName="Instructors"
                templateHeaders={["First Name", "Last Name", "Email"]}
                mapRow={mapCSVRow}
            />
        </div>
    );
}
