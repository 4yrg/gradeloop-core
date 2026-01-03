"use client"

import { ArrowUpDown, CheckSquare, ChevronDown, Edit, MoreVertical, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock data - in real app this would come from params and API
const COURSE_DATA = {
    id: "1",
    title: "Introduction to programming",
    semester: "Semester 1 2025 (jan/june)",
    department: "IT",
    code: "SE IT1010",
    description: "This course introduces fundamental programming concepts using Python. Students will learn problem-solving techniques, algorithm design, data structures, and object-oriented programming principles. The course emphasizes hands-on coding experience through practical assignments and projects.",
    objectives: [
        "Understand core programming concepts including variables, loops, and functions.",
        "Apply problem-solving strategies to design and implement algorithms.",
        "Develop proficiency in Python programming and debugging techniques.",
        "Create programs using object-oriented programming principles.",
    ],
    instructor: {
        name: "John Doe",
        avatar: "JD"
    }
}

const ASSIGNMENTS = [
    {
        id: "1",
        name: "Python Basics & Variables",
        released: "JAN 15",
        due: "22",
        submissions: 45,
        graded: "100%",
        published: true,
        regrades: "OFF"
    },
    {
        id: "2",
        name: "Control Flow & Loops",
        released: "JAN 29",
        due: "12",
        submissions: 38,
        graded: "75%",
        published: true,
        regrades: "ON"
    },
    {
        id: "3",
        name: "Functions & Modules",
        released: "FEB 12",
        due: "8",
        submissions: 42,
        graded: "50%",
        published: false,
        regrades: "OFF"
    },
    {
        id: "4",
        name: "Data Structures (Lists & Dicts)",
        released: "FEB 26",
        due: "15",
        submissions: 28,
        graded: "25%",
        published: false,
        regrades: "OFF"
    },
    {
        id: "5",
        name: "Object-Oriented Programming",
        released: "MAR 12",
        due: "20",
        submissions: 15,
        graded: "0%",
        published: false,
        regrades: "OFF"
    },
]

export default function CourseDetailPage() {
    return (
        <div className="flex gap-6 min-h-[calc(100vh-theme(spacing.16))]">
            {/* Main Content */}
            <div className="flex-1 space-y-6">
                {/* Course Header */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="font-medium">{COURSE_DATA.title}</span>
                        <span>|</span>
                        <span>{COURSE_DATA.semester}</span>
                        <span>|</span>
                        <span className="font-mono uppercase tracking-wider">
                            {COURSE_DATA.department} {COURSE_DATA.code}
                        </span>
                    </div>
                </div>

                {/* Description and Objectives */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Description */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold">Description</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {COURSE_DATA.description}
                        </p>
                    </div>

                    {/* Objectives / Todos */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold">Objectives / Todos</h3>
                        <ul className="space-y-1.5">
                            {COURSE_DATA.objectives.map((objective, index) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-foreground">•</span>
                                    {objective}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="dashboard" className="w-full">
                    <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                        <TabsTrigger
                            value="dashboard"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                            <ArrowUpDown className="h-4 w-4" />
                            ACTIVE ASSIGNMENTS
                        </TabsTrigger>
                        <TabsTrigger
                            value="released"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                            RELEASED
                        </TabsTrigger>
                        <TabsTrigger
                            value="due"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                            <ChevronDown className="h-4 w-4" />
                            DUE (UTF)
                        </TabsTrigger>
                        <TabsTrigger
                            value="submissions"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                            <ChevronDown className="h-4 w-4" />
                            SUBMISSIONS
                        </TabsTrigger>
                        <TabsTrigger
                            value="graded"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                            <ChevronDown className="h-4 w-4" />
                            GRADED
                        </TabsTrigger>
                        <TabsTrigger
                            value="published"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                            PUBLISHED
                        </TabsTrigger>
                        <TabsTrigger
                            value="regrades"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                            REGRADES
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="dashboard" className="mt-6">
                        {/* Assignments Table */}
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[300px]">Assignment</TableHead>
                                        <TableHead>RELEASED</TableHead>
                                        <TableHead>DUE (UTF)</TableHead>
                                        <TableHead>SUBMISSIONS</TableHead>
                                        <TableHead>GRADED</TableHead>
                                        <TableHead>PUBLISHED</TableHead>
                                        <TableHead>REGRADES</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ASSIGNMENTS.map((assignment) => (
                                        <TableRow key={assignment.id}>
                                            <TableCell className="font-medium">
                                                {assignment.name}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {assignment.released}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {assignment.due}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {assignment.submissions}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {assignment.graded}
                                            </TableCell>
                                            <TableCell>
                                                {assignment.published ? (
                                                    <CheckSquare className="h-4 w-4" />
                                                ) : (
                                                    <div className="h-4 w-4 border border-muted-foreground" />
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {assignment.regrades}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuItem>
                                                            <span className="flex items-center gap-2">
                                                                Go to assignment
                                                                <span className="ml-auto text-xs">›</span>
                                                            </span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <span className="flex items-center gap-2">
                                                                <Users className="h-4 w-4" />
                                                                View members
                                                            </span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <span className="flex items-center gap-2">
                                                                <Edit className="h-4 w-4" />
                                                                Edit assignment
                                                            </span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="released">
                        <div className="text-sm text-muted-foreground">Released assignments view</div>
                    </TabsContent>

                    <TabsContent value="due">
                        <div className="text-sm text-muted-foreground">Due assignments view</div>
                    </TabsContent>

                    <TabsContent value="submissions">
                        <div className="text-sm text-muted-foreground">Submissions view</div>
                    </TabsContent>

                    <TabsContent value="graded">
                        <div className="text-sm text-muted-foreground">Graded assignments view</div>
                    </TabsContent>

                    <TabsContent value="published">
                        <div className="text-sm text-muted-foreground">Published assignments view</div>
                    </TabsContent>

                    <TabsContent value="regrades">
                        <div className="text-sm text-muted-foreground">Regrades view</div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Sidebar */}
            <div className="w-64 space-y-6 hidden lg:block">
                {/* Instructor Card */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Instructor</h3>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-sm font-medium">
                            {COURSE_DATA.instructor.avatar}
                        </div>
                        <span className="text-sm font-medium">{COURSE_DATA.instructor.name}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
