"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { courseService } from "@/services/course.service"
import { StudentSidebar } from "@/components/sidebar/student-sidebar"
import { MyCoursesWidget } from "@/components/tables/my-courses-widget"
import { AnnouncementsWidget } from "@/components/tables/announcements-widget"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function StudentDashboardPage() {
    const { data: courses, isLoading: coursesLoading } = useQuery({
        queryKey: ["my-courses"],
        queryFn: courseService.getMyCourses,
    })

    const { data: announcements, isLoading: announcementsLoading } = useQuery({
        queryKey: ["announcements"],
        queryFn: courseService.getAnnouncements,
    })

    // Calculate upcoming deadlines from courses
    const upcomingDeadlines = courses
        ?.filter(c => c.nextDeadline)
        .map(c => ({
            courseName: c.name,
            ...c.nextDeadline!
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5)

    if (coursesLoading || announcementsLoading) {
        return (
            <div className="flex">
                <div className="hidden w-64 md:block">
                    <Skeleton className="h-screen w-full" />
                </div>
                <div className="flex-1 p-8">
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-48" />
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Skeleton className="h-[200px] rounded-xl" />
                            <Skeleton className="h-[200px] rounded-xl" />
                            <Skeleton className="h-[200px] rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen">
            {/* Desktop Sidebar */}
            <div className="hidden w-64 md:block">
                <StudentSidebar className="fixed inset-y-0 w-64" />
            </div>

            {/* Mobile Sidebar */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden absolute top-4 left-4 z-50">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 border-r-0 w-64">
                    <StudentSidebar />
                </SheetContent>
            </Sheet>

            <main className="flex-1 md:ml-64 bg-slate-50/50 dark:bg-slate-900/50">
                <ScrollArea className="h-screen">
                    <div className="p-4 md:p-8 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between"
                        >
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                                <p className="text-muted-foreground">
                                    Welcome back to your learning space.
                                </p>
                            </div>
                        </motion.div>

                        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                            <motion.div
                                className="lg:col-span-2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <MyCoursesWidget courses={courses || []} />
                            </motion.div>

                            <motion.div
                                className="space-y-6"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <AnnouncementsWidget announcements={announcements || []} />

                                {/* Quick upcoming deadlines widget (simple version) */}
                                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                                    <h3 className="font-semibold leading-none tracking-tight mb-4">Upcoming Deadlines</h3>
                                    <div className="space-y-4">
                                        {upcomingDeadlines?.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                                <div>
                                                    <p className="font-medium text-sm">{item.title}</p>
                                                    <p className="text-xs text-muted-foreground">{item.courseName}</p>
                                                </div>
                                                <div className="text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded">
                                                    {item.date}
                                                </div>
                                            </div>
                                        ))}
                                        {(!upcomingDeadlines || upcomingDeadlines.length === 0) && (
                                            <p className="text-sm text-muted-foreground">No upcoming deadlines.</p>
                                        )}
                                    </div>
                                </div>

                            </motion.div>
                        </div>
                    </div>
                </ScrollArea>
            </main>
        </div>
    )
}
