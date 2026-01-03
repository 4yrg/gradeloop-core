import { Building2 } from "lucide-react";

export default function InstituteAdminPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <div className="bg-muted p-3 text-primary border">
                    <Building2 className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Institute Administration</h1>
                    <p className="text-muted-foreground">Manage staff, students, and institute resources.</p>
                </div>
            </div>

            <div className="border border-dashed border-border bg-muted/30 p-8 text-center">
                <p className="text-sm text-muted-foreground">Institute dashboard content goes here</p>
            </div>
        </div>
    );
}
