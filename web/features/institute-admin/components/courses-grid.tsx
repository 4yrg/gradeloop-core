"use client";

import { Course } from "../types";
import { CourseCard } from "./course-card";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoursesGridProps {
    data: Course[];
    onCourseClick: (course: Course) => void;
    onCreateClick: () => void;
}

export function CoursesGrid({ data, onCourseClick, onCreateClick }: CoursesGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* "New Course" Placeholder Card */}
            <button
                onClick={onCreateClick}
                className={cn(
                    "flex flex-col items-center justify-center h-48",
                    "border-[1.5px] border-dashed border-zinc-400 hover:border-zinc-600",
                    "transition-all cursor-pointer rounded-sm bg-transparent",
                    "text-zinc-500 hover:text-zinc-700"
                )}
            >

                <span className="text-sm font-normal">+ Create new course</span>
            </button>

            {data.map((c) => (
                <CourseCard
                    key={c.id}
                    course={c}
                    onClick={onCourseClick}
                />
            ))}
        </div>
    );
}
