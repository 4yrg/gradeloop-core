"use client"

import { useQuery } from "@tanstack/react-query"
import { AdminService } from "@/services/admin.service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AcademicTree } from "@/components/admin/AcademicTree"
import { Plus, Download, Upload, RefreshCw } from "lucide-react"

export default function AcademicStructurePage() {
    const { data: structure, isLoading } = useQuery({
        queryKey: ['academic-structure'],
        queryFn: AdminService.getAcademicStructure
    })

    return (
        <div className="space-y-8 animate-in fade-in duration-500 p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Academic Structure</h1>
                    <p className="text-muted-foreground">Manage faculties, degrees, batches, and classes hierarchy.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import</Button>
                    <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export</Button>
                    <Button><Plus className="mr-2 h-4 w-4" /> Add Faculty</Button>
                </div>
            </div>

            <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Hierarchy Editor</CardTitle>
                            <CardDescription>
                                Defines the structure of the institution. Changes here affect global navigation and course availability.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <AcademicTree data={structure || []} />
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm">
                                <h4 className="font-semibold text-yellow-800 dark:text-yellow-500 mb-1">Structure Locked</h4>
                                <p className="text-yellow-700 dark:text-yellow-600">
                                    Major structural changes are disabled during active academic terms. Contact IT Support for urgent modifications.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Statistics</h4>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Faculties</span>
                                    <span className="font-mono">2</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Degree Programs</span>
                                    <span className="font-mono">5</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Active Classes</span>
                                    <span className="font-mono">28</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
