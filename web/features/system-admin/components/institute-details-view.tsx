"use client"

import { useInstitute } from "../../../hooks/institute/useInstitutes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { OverviewTab } from "./institute-details/overview-tab"
import { AdminsTab } from "./institute-details/admins-tab"
import { SetupProgressTab } from "./institute-details/setup-progress-tab"
import { ActivityLogsTab } from "./institute-details/activity-logs-tab"
import { Skeleton } from "../../../components/ui/skeleton"

interface InstituteDetailsViewProps {
    instituteId: string
}

export function InstituteDetailsView({ instituteId }: InstituteDetailsViewProps) {
    const { data: institute, isLoading, refetch } = useInstitute(instituteId)

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-[300px] w-full" />
            </div>
        )
    }

    if (!institute) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Institute not found.
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">{institute.name}</h2>
                <p className="text-sm text-muted-foreground">
                    {institute.domain} • Joined {new Intl.DateTimeFormat("en-US").format(new Date(institute.createdAt!))}
                </p>
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
                    <AdminsTab
                        admins={institute.admins}
                        instituteId={institute.id!}
                        onRefresh={refetch}
                    />
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
