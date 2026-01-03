"use client"

import { SystemAdminModals } from "@/features/system-admin/components/system-admin-modals"

export default function SystemAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            {children}
            <SystemAdminModals />
        </div>
    )
}
