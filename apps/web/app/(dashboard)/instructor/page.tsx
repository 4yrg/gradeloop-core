import { Info, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/instructor/course-card";
import { CreateCourseCard } from "@/components/instructor/create-course-card";

const semesters = [
    {
        title: "2025 Semester 1 (Jan-June)",
        courses: [
            {
                id: 1,
                name: "Introduction to programming",
                degree: "IT",
                specialization: "SE",
                code: "IT1010",
                description: "Lorem ipsum dolor sit, amet consectetur.",
                assignmentCount: 2,
            }
        ]
    },
    {
        title: "2025 Semester 2 (Jan-June)",
        courses: [
            {
                id: 2,
                name: "Data structures and algorithms",
                degree: "IT",
                specialization: "SE",
                code: "IT2070",
                description: "Lorem ipsum dolor sit, amet consectetur.",
                assignmentCount: 2,
            }
        ]
    }
]

export default function InstructorPage() {
    return (
        <div className="flex flex-col gap-10 pb-20">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Your courses</h1>
            </div>

            <div className="flex items-center gap-3 bg-muted p-4 border">
                <Info className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium">
                    Everything you need to know about gradeloop is with <span className="underline cursor-pointer">Getting started guide.</span>
                </p>
            </div>

            {semesters.map((semester) => (
                <div key={semester.title} className="flex flex-col gap-6">
                    <h2 className="text-lg font-bold">{semester.title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {semester.courses.map((course) => (
                            <CourseCard key={course.id} {...course} />
                        ))}
                        <CreateCourseCard />
                    </div>
                </div>
            ))}

            <div className="fixed bottom-0 right-0 p-2 flex justify-end gap-2 bg-background/80 backdrop-blur-sm border-t z-40 w-full md:w-[calc(100%-var(--sidebar-width))] group-data-[state=collapsed]:md:w-[calc(100%-var(--sidebar-width-icon))] transition-[width] duration-200">
                <Button variant="outline" size="sm" className="px-6">
                    <FileText className="h-4 w-4 mr-2" />
                    Enroll in course
                </Button>
                <Button size="sm" className="px-6">
                    <Plus className="h-4 w-4 mr-2" />
                    Create course
                </Button>
            </div>
        </div>
    );
}
