"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { StudentService } from "@/services/student.service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Paperclip, Calendar } from "lucide-react"

export default function CourseAnnouncementsPage() {
    const { id } = useParams()
    const courseId = id as string

    const { data: announcements, isLoading } = useQuery({
        queryKey: ['course-announcements', courseId],
        queryFn: async () => {
            const all = await StudentService.getAnnouncements()
            return all.filter(a => a.courseId === courseId)
        }
    })

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Announcements</h2>
                <p className="text-muted-foreground">Latest updates from your instructor.</p>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <div className="h-32 bg-muted animate-pulse rounded-lg border" />
                    <div className="h-32 bg-muted animate-pulse rounded-lg border" />
                </div>
            ) : (
                <div className="space-y-6">
                    {announcements?.map(ann => (
                        <Card key={ann.id} className="border-l-4 border-l-primary">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <MessageSquare className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{ann.title}</CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-xs">Instructor</Badge>
                                                <span className="flex items-center gap-1 text-xs">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(ann.date).toLocaleDateString()}
                                                </span>
                                            </CardDescription>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="leading-relaxed text-sm md:text-base">{ann.content}</p>
                                {ann.attachments && (
                                    <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                                        {ann.attachments.map((att, i) => (
                                            <Badge key={i} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                                                <Paperclip className="h-3 w-3 mr-1" /> {att}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                    {announcements?.length === 0 && (
                        <div className="text-center py-12 border rounded-lg bg-muted/10">
                            <p className="text-muted-foreground">No announcements posted yet.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
