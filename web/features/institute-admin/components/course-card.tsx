import { Course } from "../types";
import { cn } from "../../../lib/utils";
import { BookOpen } from "lucide-react";

interface CourseCardProps {
    course: Course;
    onClick: (course: Course) => void;
}

export function CourseCard({ course, onClick }: CourseCardProps) {
    return (
        <div
            onClick={() => onClick(course)}
            className={cn(
                "group relative flex flex-col justify-between h-48",
                "bg-zinc-200 cursor-pointer overflow-hidden",
                "hover:ring-2 hover:ring-primary transition-all",
                "rounded-sm"
            )}
        >
            <div className="p-5 space-y-3">
                <h3 className="text-lg font-semibold tracking-tight text-zinc-900 line-clamp-2 leading-tight">
                    {course.name}
                </h3>
                <div className="space-y-1">
                    {course.code && (
                        <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                            {course.code}
                        </p>
                    )}
                </div>
            </div>

            <div className="bg-zinc-500 text-white px-5 py-2 text-xs font-medium mt-auto flex items-center gap-2">
                <BookOpen className="h-3 w-3" />
                {course.credits} Credits
            </div>
        </div>
    );
}
