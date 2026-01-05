"use client";

import { Degree } from "../types";
import { DegreeCard } from "./degree-card";
import { Plus } from "lucide-react";
import { cn } from "../../../lib/utils";

interface DegreesGridProps {
    data: Degree[];
    onDegreeClick: (degree: Degree) => void;
    onCreateClick: () => void;
}

export function DegreesGrid({ data, onDegreeClick, onCreateClick }: DegreesGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* "New Degree" Placeholder Card */}
            <button
                onClick={onCreateClick}
                className={cn(
                    "flex flex-col items-center justify-center h-48",
                    "border-[1.5px] border-dashed border-zinc-400 hover:border-zinc-600",
                    "transition-all cursor-pointer rounded-sm bg-transparent",
                    "text-zinc-500 hover:text-zinc-700"
                )}
            >

                <span className="text-sm font-normal">+ Create new degree</span>
            </button>

            {data.map((degree) => (
                <DegreeCard
                    key={degree.id}
                    degree={degree}
                    onClick={onDegreeClick}
                />
            ))}
        </div>
    );
}
