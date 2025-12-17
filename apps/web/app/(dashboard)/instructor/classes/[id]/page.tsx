"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { InstructorService } from "@/services/instructor.service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    BookOpen,
    Users,
    FileText,
    Megaphone,
    BarChart3,
    Settings as SettingsIcon,
    Plus,
    Calendar,
    Clock,
    Send
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function ClassDetailPage() {
    const { id } = useParams()
    const classId = id as string
    const [announcementText, setAnnouncementText] = useState("")

    const { data: classDetails, isLoading } = useQuery({
        queryKey: ['class-details', classId],
        queryFn: () => InstructorService.getClassDetails(classId)
    })

    const { data: announcements } = useQuery({
        queryKey: ['class-announcements', classId],
        queryFn: () => InstructorService.getClassAnnouncements(classId)
    })

    if (isLoading) {
        return <div className="p-8">Loading class details...</div>
    }

    if (!classDetails) {
        return <div className="p-8">Class not found</div>
    }

    const handlePostAnnouncement = async () => {
        if (!announcementText.trim()) return
        await InstructorService.postAnnouncement(classId, { content: announcementText })
        setAnnouncementText("")
        // Refetch announcements
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Class Header */}
            <div className="bg-card border rounded-lg p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{classDetails.course?.code}</Badge>
                            <Badge variant="secondary">{classDetails.batch}</Badge>
                            <Badge variant={classDetails.status === 'active' ? 'default' : 'secondary'}>
                                {classDetails.status}
                            </Badge>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">{classDetails.course?.name}</h1>
                        <p className="text-muted-foreground max-w-2xl">{classDetails.course?.description}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <SettingsIcon className="mr-2 h-4 w-4" />
                            Settings
                        </Button>
                    </div>
                </div>
                <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {classDetails.studentCount} Students
                    </div>
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {classDetails.assignmentCount} Assignments
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {classDetails.academicYear}
                    </div>
                </div>
            </div>

            {/* Tabbed Content */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-6 lg:w-auto">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="announcements">Announcements</TabsTrigger>
                    <TabsTrigger value="assignments">Assignments</TabsTrigger>
                    <TabsTrigger value="students">Students</TabsTrigger>
                    <TabsTrigger value="competencies">Competencies</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Module Outline</CardTitle>
                                    <CardDescription>Course structure and learning objectives</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {['Introduction & Fundamentals', 'Core Concepts', 'Advanced Topics', 'Project Work'].map((module, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="font-bold text-sm">{idx + 1}</span>
                                                </div>
                                                <span className="font-medium">{module}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Assignment Completion</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {classDetails.assignments?.slice(0, 3).map((assignment: any) => (
                                            <div key={assignment.id} className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium">{assignment.title}</span>
                                                    <span className="text-muted-foreground">75%</span>
                                                </div>
                                                <Progress value={75} className="h-2" />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Class Statistics</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-muted-foreground">Average Grade</span>
                                            <span className="font-bold">78.5%</span>
                                        </div>
                                        <Progress value={78.5} className="h-2" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-muted-foreground">Completion Rate</span>
                                            <span className="font-bold">85%</span>
                                        </div>
                                        <Progress value={85} className="h-2" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Button variant="outline" className="w-full justify-start" asChild>
                                        <Link href="/instructor/assignments/create">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Assignment
                                        </Link>
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start">
                                        <Megaphone className="mr-2 h-4 w-4" />
                                        Post Announcement
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start" asChild>
                                        <Link href={`/instructor/analytics?class=${classId}`}>
                                            <BarChart3 className="mr-2 h-4 w-4" />
                                            View Analytics
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* ANNOUNCEMENTS TAB */}
                <TabsContent value="announcements" className="mt-6">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Post New Announcement</CardTitle>
                                <CardDescription>Share updates with your students</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="announcement">Message</Label>
                                    <Textarea
                                        id="announcement"
                                        placeholder="Type your announcement here..."
                                        value={announcementText}
                                        onChange={(e) => setAnnouncementText(e.target.value)}
                                        rows={4}
                                    />
                                </div>
                                <Button onClick={handlePostAnnouncement}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Post Announcement
                                </Button>
                            </CardContent>
                        </Card>

                        <div className="space-y-4">
                            {announcements?.map((ann: any) => (
                                <Card key={ann.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">{ann.title}</CardTitle>
                                                <CardDescription className="flex items-center gap-2 mt-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(ann.date).toLocaleDateString()}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm">{ann.content}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                {/* ASSIGNMENTS TAB */}
                <TabsContent value="assignments" className="mt-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Class Assignments</h3>
                            <Button asChild>
                                <Link href="/instructor/assignments/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Assignment
                                </Link>
                            </Button>
                        </div>

                        <div className="grid gap-4">
                            {classDetails.assignments?.map((assignment: any) => (
                                <Card key={assignment.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">{assignment.title}</CardTitle>
                                                <CardDescription>{assignment.description}</CardDescription>
                                            </div>
                                            <Badge variant={assignment.status === 'open' ? 'default' : 'secondary'}>
                                                {assignment.status}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                                </span>
                                                <span>{assignment.points} points</span>
                                            </div>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/instructor/assignments/${assignment.id}`}>
                                                    View Details
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                {/* STUDENTS TAB */}
                <TabsContent value="students" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Student Roster</CardTitle>
                            <CardDescription>{classDetails.studentCount} enrolled students</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Input placeholder="Search students..." />
                                <p className="text-sm text-muted-foreground py-8 text-center">
                                    Student list will be displayed here
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* COMPETENCIES TAB */}
                <TabsContent value="competencies" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Competency Profiles</CardTitle>
                            <CardDescription>Track student competency development</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground py-8 text-center">
                                Competency tracking coming soon
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SETTINGS TAB */}
                <TabsContent value="settings" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Class Settings</CardTitle>
                            <CardDescription>Configure class preferences</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground py-8 text-center">
                                Settings panel coming soon
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
