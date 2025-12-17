"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { instructorService } from "@/services/instructor.service"
import { InstructorSidebar } from "@/components/sidebar/instructor-sidebar"
import { ClassCard } from "@/components/cipas/class-card"
import { PendingSubmissionsWidget } from "@/components/cipas/pending-submissions-widget"
import { PlagiarismFlagsWidget } from "@/components/cipas/plagiarism-flags-widget"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

export default function InstructorDashboardPage() {
    const { data: classes, isLoading: classesLoading } = useQuery({
        queryKey: ["instructor-classes"],
        queryFn: instructorService.getClasses,
    })

    const { data: submissions, isLoading: submissionsLoading } = useQuery({
        queryKey: ["pending-submissions"],
        queryFn: instructorService.getPendingSubmissions,
    })

    const { data: flags, isLoading: flagsLoading } = useQuery({
        queryKey: ["plagiarism-flags"],
        queryFn: instructorService.getPlagiarismFlags,
    })

    const isLoading = classesLoading || submissionsLoading || flagsLoading

    if (isLoading) {
        return (
            <div className="flex">
                <div className="hidden w-64 md:block">
                    <Skeleton className="h-screen w-full" />
                </div>
                <div className="flex-1 p-8 space-y-6">
                    <Skeleton className="h-10 w-48" />
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Skeleton className="h-40 rounded-xl" />
                        <Skeleton className="h-40 rounded-xl" />
                        <Skeleton className="h-40 rounded-xl" />
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Skeleton className="h-[400px] rounded-xl" />
                        <Skeleton className="h-[400px] rounded-xl" />
                    </div>
                </div>
            </div>
        )
    }

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
                        className="flex items-center justify-between"
                    >
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Instructor Dashboard</h1>
                            <p className="text-muted-foreground">Manage your classes and review student performance.</p>
                        </div>
                    </motion.div>

                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold tracking-tight">Active Classes</h2>
                            <Button variant="link" className="text-primary">View All Classes</Button>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {classes?.map((cls, i) => (
                                <motion.div
                                    key={cls.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <ClassCard classroom={cls} />
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    <section className="grid gap-6 md:grid-cols-2">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <PendingSubmissionsWidget submissions={submissions || []} />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <PlagiarismFlagsWidget flags={flags || []} />
                        </motion.div>
                    </section>
                </div>
            </main>
        </div>
    )
}
