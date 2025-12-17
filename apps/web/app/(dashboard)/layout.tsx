"use client"

import { Sidebar } from "@/components/navigation/Sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Top Header would go here (optional, if not in sidebar) */}

                <main className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="p-8 max-w-7xl mx-auto space-y-8">
                            {children}
                        </div>
                    </ScrollArea>
                </main>
            </div>
        </div>
    )
}
