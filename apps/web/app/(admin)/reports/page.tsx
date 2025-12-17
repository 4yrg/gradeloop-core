"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { reportService } from "@/services/report.service"
import { AdminSidebar } from "@/components/sidebar/admin-sidebar"
import { ReportCharts } from "@/components/charts/report-charts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Download, TrendingUp, Users, Activity, Code } from "lucide-react"
import { toast } from "sonner"

export default function ReportsPage() {
    const { data: plagiarismData, isLoading: isPlagiarismLoading } = useQuery({
        queryKey: ["plagiarism-stats"],
        queryFn: reportService.getPlagiarismTrends,
    })

    const { data: usageData, isLoading: isUsageLoading } = useQuery({
        queryKey: ["usage-stats"],
        queryFn: reportService.getUsageStats,
    })

    const { data: departmentData, isLoading: isDeptLoading } = useQuery({
        queryKey: ["department-stats"],
        queryFn: reportService.getDepartmentPerformance,
    })

    const handleExport = () => {
        toast.success("Report downloaded successfully")
    }

    const isLoading = isPlagiarismLoading || isUsageLoading || isDeptLoading

    return (
        <div className="flex min-h-screen">
            <div className="hidden w-64 md:block">
                <AdminSidebar className="fixed inset-y-0 w-64" />
            </div>

            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden absolute top-4 left-4 z-50">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 border-r-0 w-64">
                    <AdminSidebar />
                </SheetContent>
            </Sheet>

            <main className="flex-1 md:ml-64 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="container mx-auto p-4 md:p-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">System Reports</h1>
                            <p className="text-muted-foreground">Analytics regarding system usage and academic integrity.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={handleExport}>
                                <Download className="mr-2 h-4 w-4" />
                                Export PDF
                            </Button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Skeleton className="h-28 rounded-xl" />
                                <Skeleton className="h-28 rounded-xl" />
                                <Skeleton className="h-28 rounded-xl" />
                                <Skeleton className="h-28 rounded-xl" />
                            </div>
                            <Skeleton className="h-[400px] rounded-xl" />
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-8"
                        >
                            {/* Stat Cards */}
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{usageData?.find(d => d.name === 'Active Students')?.value}</div>
                                        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Today's Submissions</CardTitle>
                                        <Activity className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{usageData?.find(d => d.name === 'Submissions (Today)')?.value}</div>
                                        <p className="text-xs text-muted-foreground">+180 since last hour</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">IDE Sessions</CardTitle>
                                        <Code className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{usageData?.find(d => d.name === 'IDE Sessions')?.value}</div>
                                        <p className="text-xs text-muted-foreground">+12% active now</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Detection Rate</CardTitle>
                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-amber-600">5.2%</div>
                                        <p className="text-xs text-muted-foreground">-1.1% from last month</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Charts */}
                            <ReportCharts
                                plagiarismData={plagiarismData || []}
                                departmentData={departmentData || []}
                            />
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    )
}
