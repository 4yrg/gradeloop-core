import { Info, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/shared/course-card";
import { CreateCourseCard } from "@/components/instructor/create-course-card";

interface Course {
    id: string;
    name: string;
    degree: string;
    specialization: string;
    code: string;
    description: string;
    assignmentCount: number;
}

interface Semester {
    title: string;
    courses: Course[];
}

const semesters: Semester[] = [
    {
        title: "2025 Semester 1 (Jan-June)",
        courses: [
            {
                id: "1",
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
                id: "2",
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
        <div className="flex flex-col gap-10 pb-24">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Your courses</h1>
                <p className="text-muted-foreground">Manage your courses and assignments for the current academic year.</p>
            </div>

            <div className="flex items-center gap-3 bg-muted/50 p-4 border rounded-md">
                <Info className="h-5 w-5 text-primary shrink-0" />
                <p className="text-sm font-medium">
                    Everything you need to know about gradeloop is with the <span className="underline cursor-pointer hover:text-primary transition-colors">Getting started guide.</span>
                </p>
            </div>

            <div className="space-y-12">
                {semesters.map((semester) => (
                    <div key={semester.title} className="flex flex-col gap-6">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold tracking-tight">{semester.title}</h2>
                            <div className="h-px bg-border flex-1 ml-4" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                            {semester.courses.map((course) => (
                                <CourseCard key={course.id} {...course} />
                            ))}
                            <CreateCourseCard />
                        </div>
                    </div>
                ))}
            </div>

            {/* Floating Action Bar */}
            <div className="fixed bottom-6 right-6 z-40 flex gap-2">
                <Button className="shadow-lg h-12 px-6 rounded-full" size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Create New Course
                </Button>
            </div>
        </div>
    );
}
