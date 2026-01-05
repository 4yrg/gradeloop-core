"use client";

import { GraduationCap, Info, Plus } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { CourseCard, StudentCourseCard } from "../../../components/shared/course-card";
import { useState } from "react";
import { EnrollmentDialog } from "../../../components/student/enrollment-dialog";

const semesters = [
    {
        title: "Year 1 Semester 2",
        courses: [
            {
                id: "1",
                name: "Database Management Systems",
                degree: "IT",
                specialization: "SE",
                code: "IT1010",
                description: "Introduction to relational databases, SQL, and database design principles.",
                assignmentCount: 4,
            },
            {
                id: "2",
                name: "Data Structures & Algorithms",
                degree: "IT",
                specialization: "SE",
                code: "IT1020",
                description: "Fundamental data structures and algorithm analysis techniques.",
                assignmentCount: 3,
            },
        ],
    },
    {
        title: "Year 1 Semester 1",
        courses: [
            {
                id: "3",
                name: "Introduction to Programming",
                degree: "IT",
                specialization: "IT",
                code: "IT1001",
                description: "Basics of programming using Python and problem-solving logic.",
                assignmentCount: 5,
            },
        ],
    },
];

export default function StudentPage() {
    const [isEnrollOpen, setIsEnrollOpen] = useState(false);

    return (
        <div className="flex flex-col gap-10 pb-20">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Your courses</h1>
            </div>

            <div className="flex items-center gap-3 bg-muted p-4 border">
                <Info className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium">
                    Welcome to your student dashboard. Here you can find all your enrolled courses and upcoming assignments.
                </p>
            </div>

            {semesters.map((semester) => (
                <div key={semester.title} className="flex flex-col gap-6">
                    <h2 className="text-lg font-bold">{semester.title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {semester.courses.map((course) => (
                            <StudentCourseCard key={course.id} {...course} />
                        ))}
                    </div>
                </div>
            ))}

            <div className="fixed bottom-0 right-0 p-2 flex justify-end gap-2 bg-background/80 backdrop-blur-sm border-t z-40 w-full md:w-[calc(100%-var(--sidebar-width))] group-data-[state=collapsed]:md:w-[calc(100%-var(--sidebar-width-icon))] transition-[width] duration-200">
                <Button variant="outline" size="sm" className="px-6" onClick={() => setIsEnrollOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Enroll in course
                </Button>
            </div>

            <EnrollmentDialog open={isEnrollOpen} onOpenChange={setIsEnrollOpen} />
        </div>
    );
}
