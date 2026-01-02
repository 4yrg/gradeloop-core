import { AppSidebar } from "@/components/shared/app-sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
            <AppSidebar />
            <main className="lg:pl-64">
                <div className="container mx-auto p-4 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
