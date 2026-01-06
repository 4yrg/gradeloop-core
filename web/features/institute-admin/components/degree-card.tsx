import { Degree } from "../types";
import { cn } from "../../../lib/utils";
import { MoreVertical, Edit, Trash2, BookOpen } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface DegreeCardProps {
    degree: Degree;
    onClick: (degree: Degree) => void;
    onEdit?: (degree: Degree) => void;
    onDelete?: (id: string) => void;
    onManageCourses?: (degree: Degree) => void;
}

export function DegreeCard({ degree, onClick, onEdit, onDelete, onManageCourses }: DegreeCardProps) {
    return (
        <div
            onClick={() => onClick(degree)}
            className={cn(
                "group relative flex flex-col justify-between h-48",
                "bg-zinc-200 cursor-pointer overflow-hidden",
                "hover:ring-2 hover:ring-primary transition-all",
                "rounded-sm"
            )}
        >
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/50 hover:bg-white" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {onManageCourses && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onManageCourses(degree); }}>
                                <BookOpen className="mr-2 h-4 w-4" />
                                Manage Courses
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {onEdit && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(degree); }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                        )}
                        {onDelete && (
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={(e) => { e.stopPropagation(); degree.id && onDelete(degree.id); }}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="p-5 space-y-3">
                <h3 className="text-lg font-semibold tracking-tight text-zinc-900 line-clamp-2 leading-tight">
                    {degree.name}
                </h3>
                <div className="space-y-1">
                    {degree.code && (
                        <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                            {degree.code}
                        </p>
                    )}
                    {degree.description && (
                        <p className="text-xs text-zinc-600 line-clamp-2">
                            {degree.description}
                        </p>
                    )}
                </div>
            </div>

            <div className="bg-zinc-500 text-white px-5 py-2 text-xs font-medium mt-auto">
                {degree.requiredCredits} Credits
            </div>
        </div>
    );
}
