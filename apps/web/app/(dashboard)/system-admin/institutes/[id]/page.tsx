"use client"

import { useInstitute } from "@/features/system-admin/api/queries"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewTab } from "@/features/system-admin/components/institute-details/overview-tab"
import { AdminsTab } from "@/features/system-admin/components/institute-details/admins-tab"
import { SetupProgressTab } from "@/features/system-admin/components/institute-details/setup-progress-tab"
import { ActivityLogsTab } from "@/features/system-admin/components/institute-details/activity-logs-tab"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function InstituteDetailPage() {
    const { id } = useParams()
    const { data: institute, isLoading } = useInstitute(id as string)

    if (isLoading) return <div>Loading institute details...</div>
    if (!institute) return <div>Institute not found.</div>

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/system-admin/institutes">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{institute.name}</h1>
                        <p className="text-muted-foreground">
                            {institute.domain} • Joined {new Date(institute.createdAt!).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                </Button>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="admins">Admins</TabsTrigger>
                    <TabsTrigger value="setup">Setup Progress</TabsTrigger>
                    <TabsTrigger value="logs">Activity Logs</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                    <OverviewTab institute={institute} />
                </TabsContent>
                <TabsContent value="admins">
                    <AdminsTab admins={institute.admins} />
                </TabsContent>
                <TabsContent value="setup">
                    <SetupProgressTab instituteId={institute.id!} progress={institute.setupProgress} />
                </TabsContent>
                <TabsContent value="logs">
                    <ActivityLogsTab instituteId={institute.id!} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
