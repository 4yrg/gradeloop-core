import { Plus } from "lucide-react";

export function CreateCourseCard() {
    return (
        <button className="flex min-h-[160px] w-full flex-col items-center justify-center border-2 border-dashed border-border bg-transparent p-6 transition-colors hover:bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">Create a new course</span>
            </div>
        </button>
    );
}
