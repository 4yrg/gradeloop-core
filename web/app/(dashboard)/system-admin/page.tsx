import { Shield } from "lucide-react";

export default function SystemAdminPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <div className="bg-muted p-3 text-primary border">
                    <Shield className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Administration</h1>
                    <p className="text-muted-foreground">Manage system-wide configurations and tenants.</p>
                </div>
            </div>

            <div className="border border-dashed border-border bg-muted/30 p-8 text-center">
                <p className="text-sm text-muted-foreground">Dashboard content goes here</p>
            </div>
        </div>
    );
}
