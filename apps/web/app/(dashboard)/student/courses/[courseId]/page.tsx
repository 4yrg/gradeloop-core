"use client"

import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, FileText, Video, Download } from "lucide-react"

export default function CoursePage() {
    const params = useParams()
    const courseId = params.courseId as string

    // Mock Data
    const course = {
        id: courseId,
        title: "CS101: Introduction to Computer Science",
        instructor: "Dr. Sarah Teacher",
        progress: 66,
        announcements: [
            { id: 1, text: "Midterm grades are released.", date: "2 days ago" },
            { id: 2, text: "No class next Monday.", date: "1 week ago" }
        ],
        assignments: [
            { id: 1, title: "Lab 1: Python Basics", status: "Completed", score: "90/100" },
            { id: 2, title: "Lab 2: Loops & Arrays", status: "Active", due: "Tomorrow" },
            { id: 3, title: "Project: Tic Tac Toe", status: "Locked", due: "Next Week" }
        ]
    }

    return (
        <div className="space-y-6">
            {/* Course Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">{course.title}</h1>
                    <p className="text-muted-foreground">Instructor: {course.instructor}</p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-1">Progress: {course.progress}%</Badge>
            </div>

            <Tabs defaultValue="assignments" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="assignments">Assignments</TabsTrigger>
                    <TabsTrigger value="materials">Materials</TabsTrigger>
                    <TabsTrigger value="announcements">Announcements</TabsTrigger>
                </TabsList>

                <TabsContent value="assignments" className="space-y-4">
                    {course.assignments.map(a => (
                        <Card key={a.id} className="flex flex-row items-center justify-between p-4 bg-card/50">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full ${a.status === 'Completed' ? 'bg-green-500/10' : 'bg-blue-500/10'}`}>
                                    <FileText className={`h-6 w-6 ${a.status === 'Completed' ? 'text-green-500' : 'text-blue-500'}`} />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{a.title}</h3>
                                    <p className="text-sm text-muted-foreground">Due: {a.due || "Submitted"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {a.score && <span className="font-bold text-green-600">{a.score}</span>}
                                <Button variant={a.status === 'Locked' ? "secondary" : "default"} disabled={a.status === 'Locked'}>
                                    {a.status === 'Completed' ? 'Review' : a.status === 'Locked' ? 'Locked' : 'Start'}
                                </Button>
                            </div>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="materials">
                    <Card>
                        <CardHeader>
                            <CardTitle>Course Materials</CardTitle>
                            <CardDescription>Slides and recordings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <div className="flex items-center gap-2">
                                    <Video className="h-4 w-4 text-red-500" />
                                    <span>Lecture 1: Introduction</span>
                                </div>
                                <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="announcements">
                    {course.announcements.map(ann => (
                        <Card key={ann.id} className="mb-4">
                            <CardContent className="pt-6">
                                <p className="font-medium">{ann.text}</p>
                                <p className="text-xs text-muted-foreground mt-2">{ann.date}</p>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>
            </Tabs>
        </div>
    )
}
