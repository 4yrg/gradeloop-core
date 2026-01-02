import { Building2 } from "lucide-react";

export default function InstituteAdminPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Building2 className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Institute Administration</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Manage staff, students, and institute resources.</p>
                </div>
            </div>

            <div className="border border-dashed border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-sm text-zinc-500">Institute dashboard content goes here</p>
            </div>
        </div>
    );
}
