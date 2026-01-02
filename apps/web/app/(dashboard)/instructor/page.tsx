import { BookOpen } from "lucide-react";

export default function InstructorPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <div className="bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <BookOpen className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">lnstructor Portal</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Manage your courses and assignments.</p>
                </div>
            </div>

            <div className="border border-dashed border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-sm text-zinc-500">Instructor dashboard content goes here</p>
            </div>
        </div>
    );
}
