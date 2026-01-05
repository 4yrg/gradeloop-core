import { ClassGroup } from "../types";
import { cn } from "../../../lib/utils";
import { Users } from "lucide-react";

interface ClassCardProps {
    classGroup: ClassGroup;
    onClick: (classGroup: ClassGroup) => void;
}

export function ClassCard({ classGroup, onClick }: ClassCardProps) {
    return (
        <div
            onClick={() => onClick(classGroup)}
            className={cn(
                "group relative flex flex-col justify-between h-48",
                "bg-zinc-200 cursor-pointer overflow-hidden",
                "hover:ring-2 hover:ring-primary transition-all",
                "rounded-sm"
            )}
        >
            <div className="p-5 space-y-3">
                <h3 className="text-lg font-semibold tracking-tight text-zinc-900 line-clamp-2 leading-tight">
                    {classGroup.name}
                </h3>
            </div>

            <div className="bg-zinc-500 text-white px-5 py-2 text-xs font-medium mt-auto flex items-center gap-2">
                <Users className="h-3 w-3" />
                {classGroup.studentCount} Students
            </div>
        </div>
    );
}
