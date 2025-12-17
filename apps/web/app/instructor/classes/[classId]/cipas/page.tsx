"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { useParams } from "next/navigation"
import { cipasService } from "@/services/cipas.service"
import { InstructorSidebar } from "@/components/sidebar/instructor-sidebar"
import { SimilarityTable } from "@/components/cipas/similarity-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Search, Filter } from "lucide-react"

export default function CIPASDashboardPage() {
    const params = useParams()
    const classId = params.classId as string || '1' // Defaulting for demo

    const [filterType, setFilterType] = useState<string>("all")
    const [searchTerm, setSearchTerm] = useState("")

    const { data: reports, isLoading } = useQuery({
        queryKey: ["cipas-reports", classId],
        queryFn: () => cipasService.getClassReports(classId),
    })

    // Basic client-side filtering
    const filteredReports = reports?.filter(report => {
        const matchesSearch = report.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase())

        if (filterType === "all") return matchesSearch
        if (filterType === "flagged") return matchesSearch && report.status === "Flagged"
        if (filterType === "high_similarity") return matchesSearch && report.totalSimilarity > 80

        return matchesSearch
    })

    return (
        <div className="flex min-h-screen">
            <div className="hidden w-64 md:block">
                <InstructorSidebar className="fixed inset-y-0 w-64" />
            </div>

            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden absolute top-4 left-4 z-50">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 border-r-0 w-64">
                    <InstructorSidebar />
                </SheetContent>
            </Sheet>

            <main className="flex-1 md:ml-64 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="container mx-auto p-4 md:p-8 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-2"
                    >
                        <h1 className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-400">
                            CIPAS Analysis Dashboard
                        </h1>
                        <p className="text-muted-foreground">
                            Monitor and review code similarity reports for academic integrity.
                        </p>
                    </motion.div>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search student or assignment..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Reports</SelectItem>
                                    <SelectItem value="flagged">Flagged Only</SelectItem>
                                    <SelectItem value="high_similarity">Critical (>80%)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <SimilarityTable reports={filteredReports || []} />
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    )
}
