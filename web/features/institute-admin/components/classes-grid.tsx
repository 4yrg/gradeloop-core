"use client";

import { ClassGroup } from "../types";
import { ClassCard } from "./class-card";
import { Plus } from "lucide-react";
import { cn } from "../../../lib/utils";

interface ClassesGridProps {
    data: ClassGroup[];
    onClassClick: (classGroup: ClassGroup) => void;
    onCreateClick: () => void;
}

export function ClassesGrid({ data, onClassClick, onCreateClick }: ClassesGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* "New Class" Placeholder Card */}
            <button
                onClick={onCreateClick}
                className={cn(
                    "flex flex-col items-center justify-center h-48",
                    "border-[1.5px] border-dashed border-zinc-400 hover:border-zinc-600",
                    "transition-all cursor-pointer rounded-sm bg-transparent",
                    "text-zinc-500 hover:text-zinc-700"
                )}
            >

                <span className="text-sm font-normal">+ Create new class</span>
            </button>

            {data.map((c) => (
                <ClassCard
                    key={c.id}
                    classGroup={c}
                    onClick={onClassClick}
                />
            ))}
        </div>
    );
}
