import { GraduationCap } from "lucide-react";

export default function StudentPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <div className="bg-muted p-3 text-primary border">
                    <GraduationCap className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Student Portal</h1>
                    <p className="text-muted-foreground">View enrolled courses and grades.</p>
                </div>
            </div>

            <div className="border border-dashed border-border bg-muted/30 p-8 text-center">
                <p className="text-sm text-muted-foreground">Student dashboard content goes here</p>
            </div>
        </div>
    );
}
