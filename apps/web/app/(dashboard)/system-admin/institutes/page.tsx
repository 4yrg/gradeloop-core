"use client"

import { useInstitutes } from "@/features/system-admin/api/queries"
import { InstituteTable } from "@/features/system-admin/components/institute-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function InstitutesPage() {
    const { data: institutes, isLoading } = useInstitutes()

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Institutes</h1>
                    <p className="text-muted-foreground">
                        Manage your platform's institutes and their administrators.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/system-admin/institutes/create">
                        <Plus className="mr-2 h-4 w-4" /> Create Institute
                    </Link>
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
