

import { Metadata } from "next"
import { Sidebar } from "@/components/navigation/Sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"

export const metadata: Metadata = {
    title: "Admin Dashboard | GradeLoop",
    description: "System administration and academic governance",
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="p-8">
                        {children}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
