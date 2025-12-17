"use client"

import Papa from 'papaparse'
import { useState, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AdminService, ClassWithDetails, AcademicNode } from "@/services/admin.service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, MoreHorizontal, UserCog, Ban, Eye, Loader2, ArrowUpRight, Plus, Upload } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function AdminClassesPage() {
    const queryClient = useQueryClient()
    const { data: classes, isLoading } = useQuery({
        queryKey: ['admin-classes'],
        queryFn: AdminService.getAllClasses
    })

    const { data: batches } = useQuery({
        queryKey: ['admin-batches'],
        queryFn: AdminService.getAllBatches
    })

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    // Edit Dialog State
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [selectedClass, setSelectedClass] = useState<ClassWithDetails | null>(null)
    const [instructorName, setInstructorName] = useState("")
    const [status, setStatus] = useState<'active' | 'archived'>('active')

    // Create Dialog State
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [newClassName, setNewClassName] = useState("")
    const [newClassCode, setNewClassCode] = useState("")
    const [newClassBatch, setNewClassBatch] = useState("")
    const [newClassInstructor, setNewClassInstructor] = useState("")

    const updateMutation = useMutation({
        mutationFn: (data: { id: string, updates: Partial<ClassWithDetails> }) =>
            AdminService.updateClassDetails(data.id, data.updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-classes'] })
            toast.success("Class details updated")
            setEditDialogOpen(false)
        }
    })

    const createMutation = useMutation({
        mutationFn: (data: { parentId: string, name: string, instructor: string }) => {
            return AdminService.addNode(data.parentId, {
                type: 'class',
                name: data.name,
                metadata: {
                    instructor: data.instructor,
                    status: 'active',
                    studentsCount: 0
                }
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-classes'] })
            toast.success("Class created successfully")
            setCreateDialogOpen(false)
            // Reset form
            setNewClassName("")
            setNewClassCode("")
            setNewClassBatch("")
            setNewClassInstructor("")
        }
    })

    const bulkCreateMutation = useMutation({
        mutationFn: (data: any[]) => AdminService.bulkCreateClasses(data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin-classes'] })
            toast.success(`Successfully queued ${variables.length} classes for creation`)
            setIsUploading(false)
        },
        onError: () => {
            toast.error("Failed to import classes")
            setIsUploading(false)
        }
    })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        Papa.parse(file, {
            header: true,
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    bulkCreateMutation.mutate(results.data)
                } else {
                    toast.error("CSV file is empty or invalid")
                    setIsUploading(false)
                }
                if (fileInputRef.current) fileInputRef.current.value = ""
            },
            error: (error: any) => {
                toast.error(`CSV Parsing Error: ${error.message}`)
                setIsUploading(false)
            }
        })
    }

    const handleEditClick = (cls: ClassWithDetails) => {
        setSelectedClass(cls)
        setInstructorName(cls.instructor)
        setStatus(cls.status)
        setEditDialogOpen(true)
    }

    const handleSaveEdit = () => {
        if (!selectedClass) return;
        updateMutation.mutate({
            id: selectedClass.id,
            updates: {
                instructor: instructorName,
                status: status
            }
        })
    }

    const handleCreateClass = () => {
        if (!newClassName || !newClassCode || !newClassBatch) {
            toast.error("Please fill in all required fields")
            return
        }
        const fullName = `${newClassName} (${newClassCode})`;
        createMutation.mutate({
            parentId: newClassBatch,
            name: fullName,
            instructor: newClassInstructor || "Unassigned"
        })
    }

    const filteredClasses = classes?.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.batch.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleDownloadTemplate = () => {
        const headers = ["batchId", "code", "name", "instructor"]
        // Provide a valid batch ID example if possible, or generic
        const rows = [
            ["batch-1", "IT1050", "Introduction to Data Science", "Dr. Alan Turing"],
            ["batch-1", "IT2030", "Algorithms II", "Dr. Grace Hopper"]
        ]

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", "classes_template.csv")
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Classes & Courses</h1>
                    <p className="text-muted-foreground">Manage ongoing classes, assign instructors, and monitor enrollment.</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".csv"
                        onChange={handleFileChange}
                    />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Import CSV
                    </Button>
                    <Button variant="outline" onClick={handleDownloadTemplate}>
                        <ArrowUpRight className="mr-2 h-4 w-4" /> Template
                    </Button>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Create Class
                    </Button>
                    <Button variant="outline" disabled>Export List</Button>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="space-y-1">
                        <CardTitle>All Classes</CardTitle>
                        <CardDescription>
                            Overview of all classes across all batches and degrees.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search classes..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Course Code</TableHead>
                                <TableHead>Class Name</TableHead>
                                <TableHead>Batch / Group</TableHead>
                                <TableHead>Instructor</TableHead>
                                <TableHead>Students</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredClasses?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No classes found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredClasses?.map((cls) => (
                                    <TableRow key={cls.id}>
                                        <TableCell className="font-mono font-medium">{cls.code}</TableCell>
                                        <TableCell>{cls.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{cls.batch}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {cls.instructor === "Unassigned" ? (
                                                    <Badge variant="outline" className="text-muted-foreground font-normal">Unassigned</Badge>
                                                ) : (
                                                    <span className="text-sm">{cls.instructor}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{cls.studentsCount}</TableCell>
                                        <TableCell>
                                            <Badge variant={cls.status === 'active' ? 'default' : 'secondary'}>
                                                {cls.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleEditClick(cls)}>
                                                        <UserCog className="mr-2 h-4 w-4" /> Assign / Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">
                                                        <Ban className="mr-2 h-4 w-4" /> Archive Class
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Class Details</DialogTitle>
                        <DialogDescription>
                            Update instructor assignment and status for {selectedClass?.code}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="instructor" className="text-right">
                                Instructor
                            </Label>
                            <Input
                                id="instructor"
                                value={instructorName}
                                onChange={(e) => setInstructorName(e.target.value)}
                                className="col-span-3"
                                placeholder="e.g. Dr. John Smith"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">
                                Status
                            </Label>
                            <Select
                                value={status}
                                onValueChange={(val) => setStatus(val as 'active' | 'archived')}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Class</DialogTitle>
                        <DialogDescription>
                            Add a new class to an existing batch or group.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="batch" className="text-right">
                                Batch / Group
                            </Label>
                            <Select
                                value={newClassBatch}
                                onValueChange={setNewClassBatch}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select target batch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {batches?.map(batch => (
                                        <SelectItem key={batch.id} value={batch.id}>
                                            <div className="flex flex-col items-start text-left">
                                                <span>{batch.name}</span>
                                                <span className="text-xs text-muted-foreground">{batch.path}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="code" className="text-right">
                                Course Code
                            </Label>
                            <Input
                                id="code"
                                value={newClassCode}
                                onChange={(e) => setNewClassCode(e.target.value)}
                                className="col-span-3"
                                placeholder="e.g. IT1010"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Class Name
                            </Label>
                            <Input
                                id="name"
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                className="col-span-3"
                                placeholder="e.g. Introduction to Programming"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="newInstructor" className="text-right">
                                Instructor
                            </Label>
                            <Input
                                id="newInstructor"
                                value={newClassInstructor}
                                onChange={(e) => setNewClassInstructor(e.target.value)}
                                className="col-span-3"
                                placeholder="Optional"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateClass} disabled={createMutation.isPending}>
                            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Class
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

