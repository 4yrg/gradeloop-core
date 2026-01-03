"use client"

import { useInstitutes } from "@/features/system-admin/api/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import Link from "next/link"

export default function MonitoringPage() {
    const { data: institutes, isLoading } = useInstitutes()

    const pendingInstitutes = institutes?.filter((i) => i.setupProgress < 100) || []
    const avgProgress = institutes?.length
        ? Math.round(institutes.reduce((acc, i) => acc + i.setupProgress, 0) / institutes.length)
        : 0

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Monitoring</h1>
                <p className="text-muted-foreground">
                    Track setup progress and platform-wide institute health.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgProgress}%</div>
                        <Progress value={avgProgress} className="mt-2 h-1.5" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Setup</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingInstitutes.length}</div>
                        <p className="text-xs text-muted-foreground">Institutes below 100%</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Institutes Pending Setup</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Institute</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Progress</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingInstitutes.length > 0 ? (
                                pendingInstitutes.map((institute) => (
                                    <TableRow key={institute.id}>
                                        <TableCell className="font-medium">{institute.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="warning" className="capitalize">
                                                {institute.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 max-w-[200px]">
                                                <Progress value={institute.setupProgress} className="h-2" />
                                                <span className="text-xs">{institute.setupProgress}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                href={`/system-admin/institutes/${institute.id}`}
                                                className="text-primary hover:underline text-sm font-medium"
                                            >
                                                Review
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        All institutes have completed setup.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
