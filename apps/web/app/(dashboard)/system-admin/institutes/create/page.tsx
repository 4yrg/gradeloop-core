"use client"

import { CreateInstituteForm } from "@/features/system-admin/components/create-institute-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CreateInstitutePage() {
    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/system-admin/institutes">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Institute</h1>
                    <p className="text-muted-foreground">
                        Register a new institute and assign its primary administrators.
                    </p>
                </div>
            </div>

            <CreateInstituteForm />
        </div>
    )
}
