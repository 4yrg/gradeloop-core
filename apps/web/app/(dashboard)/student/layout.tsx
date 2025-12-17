"use client"

import RoleGuard from "@/components/auth/RoleGuard"
import { Sidebar } from "@/components/navigation/Sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <RoleGuard allowedRoles={['STUDENT']}>
            <div className="flex h-screen overflow-hidden">
                {/* Sidebar */}
                <Sidebar />

                {/* Main Content */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <main className="flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="p-8 max-w-7xl mx-auto space-y-8">
                                {children}
                            </div>
                        </ScrollArea>
                    </main>
                </div>
            </div>
        </RoleGuard>
    )
}
