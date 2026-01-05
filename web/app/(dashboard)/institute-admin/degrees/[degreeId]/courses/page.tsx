"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CoursesGrid } from "../../../../../../features/institute-admin/components/courses-grid";
import { CourseModal } from "../../../../../../features/institute-admin/components/course-modal";
import { coursesService } from "../../../../../../features/institute-admin/api/courses-service";
import { Course } from "../../../../../../features/institute-admin/types";

export default function DegreeCoursesPage() {
    const params = useParams();
    const router = useRouter();
    const degreeId = params.degreeId as string;

    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (degreeId) {
            loadCourses();
        }
    }, [degreeId]);

    const loadCourses = async () => {
        try {
            setLoading(true);
            const data = await coursesService.getCoursesForDegree(degreeId);
            setCourses(data);
        } catch (error) {
            console.error("Failed to load courses", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setIsModalOpen(true);
    };

    const handleSubmit = async (data: Course) => {
        try {
            const created = await coursesService.createCourse(data);
            setCourses((prev) => [...prev, created]);
        } catch (error) {
            console.error("Failed to create course", error);
        }
    };

    const handleCourseClick = (course: Course) => {
        if (!course.id) return;
        router.push(`/institute-admin/degrees/${degreeId}/courses/${course.id}`);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold tracking-tight">Courses</h2>
                <p className="text-muted-foreground">Manage degree requirements and curriculum.</p>
            </div>

            {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading courses...</div>
            ) : (
                <CoursesGrid
                    data={courses}
                    onCourseClick={handleCourseClick}
                    onCreateClick={handleCreate}
                />
            )}

            <CourseModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSubmit={handleSubmit}
                degreeId={degreeId}
            />
        </div>
    );
}
