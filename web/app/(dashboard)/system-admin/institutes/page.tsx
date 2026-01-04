"use client"

import { useInstitutes } from "@/features/system-admin/api/queries"
import { InstituteTable } from "@/features/system-admin/components/institute-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useSystemAdminStore } from "@/features/system-admin/store/use-system-admin-store"

export default function InstitutesPage() {
    const { data: institutes, isLoading } = useInstitutes()
    const setCreateModalOpen = useSystemAdminStore((state) => state.setCreateModalOpen)

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Institutes</h1>
                    <p className="text-muted-foreground">
                        Manage your platform's institutes and their administrators.
                    </p>
                </div>
                <Button onClick={() => setCreateModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Create Institute
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <div className="h-8 w-1/3 animate-pulse bg-muted rounded" />
                    <div className="h-[400px] w-full animate-pulse bg-muted rounded" />
                </div>
            ) : (
                <InstituteTable institutes={institutes || []} />
            )}
        </div>
    )
}
