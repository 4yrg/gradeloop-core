"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { InstructorService } from "@/services/instructor.service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreHorizontal, FileEdit, Trash2, BarChart2, MessageSquare } from "lucide-react"

export default function InstructorCourseDetail() {
    const { id } = useParams()
    const courseId = id as string

    // Mock fetches
    const { data: courses } = useQuery({ queryKey: ['instructor-courses'], queryFn: InstructorService.getCourses })
    const course = courses?.find(c => c.id === courseId)

    const { data: students } = useQuery({
        queryKey: ['course-students', courseId],
        queryFn: () => InstructorService.getCourseStudents(courseId)
    })

    // Assignments query removed as we are using mockAssignments for this view


    // Mock Assignments List specifically for this view
    const mockAssignments = [
        { id: 'a1', title: 'Lab 1: Introduction', due: '2023-10-15', status: 'Closed', submissions: 140 },
        { id: 'a2', title: 'Lab 2: Loops & Arrays', due: '2023-10-22', status: 'Active', submissions: 45 },
    ]

    if (!course) return <div className="p-8">Loading...</div>

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{course.code}</Badge>
                        <Badge>{course.semester}</Badge>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">{course.name}</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Student View</Button>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> New Assignment
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="assignments" className="w-full">
                <TabsList>
                    <TabsTrigger value="stream">Stream</TabsTrigger>
                    <TabsTrigger value="assignments">Assignments</TabsTrigger>
                    <TabsTrigger value="people">People</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                {/* STREAM TAB */}
                <TabsContent value="stream" className="space-y-4 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Course Stream</CardTitle>
                            <CardDescription>Announcements and activity log.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 mb-6">
                                <Avatar><AvatarFallback>ME</AvatarFallback></Avatar>
                                <div className="w-full space-y-2">
                                    <Input placeholder="Announce something to your class..." />
                                    <div className="flex justify-end">
                                        <Button size="sm">Post</Button>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="border rounded-lg p-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6"><AvatarFallback>ME</AvatarFallback></Avatar>
                                        <span className="text-sm font-semibold">Dr. John Smith</span>
                                        <span className="text-xs text-muted-foreground">2 days ago</span>
                                    </div>
                                    <p className="text-sm">Welcome to the course! Please check the syllabus.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ASSIGNMENTS TAB */}
                <TabsContent value="assignments" className="mt-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Assignments</CardTitle>
                                <CardDescription>Manage assessments and grading.</CardDescription>
                            </div>
                            <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-2" /> Create</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Submissions</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockAssignments.map(a => (
                                        <TableRow key={a.id}>
                                            <TableCell className="font-medium">{a.title}</TableCell>
                                            <TableCell>{a.due}</TableCell>
                                            <TableCell><Badge variant="outline">{a.status}</Badge></TableCell>
                                            <TableCell>{a.submissions}/{course.enrolledCount}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem><FileEdit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                        <DropdownMenuItem><BarChart2 className="mr-2 h-4 w-4" /> View Stats</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PEOPLE TAB */}
                <TabsContent value="people" className="mt-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Students</CardTitle>
                                <CardDescription>Manage enrolled students and view profiles.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Search students..." className="pl-8 w-[250px]" />
                                </div>
                                <Button size="sm">Add Student</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Performance</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students?.map(s => (
                                        <TableRow key={s.id}>
                                            <TableCell className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8"><AvatarImage src={s.avatar} /><AvatarFallback>{s.name[0]}</AvatarFallback></Avatar>
                                                <span className="font-medium">{s.name}</span>
                                            </TableCell>
                                            <TableCell>{s.email}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Good</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm"><MessageSquare className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SETTINGS TAB */}
                <TabsContent value="settings" className="mt-6">
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>General Settings</CardTitle>
                                <CardDescription>Course details and visibility.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Course Name</Label>
                                    <Input defaultValue={course.name} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Course Description</Label>
                                    <Input defaultValue={course.description} />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Features</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Enable AI Assistance for Students</Label>
                                    <Switch />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Enable Leaderboard</Label>
                                    <Switch />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
