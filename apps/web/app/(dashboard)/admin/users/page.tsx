"use client"

import { useState, useRef } from "react"
import { useMutation } from "@tanstack/react-query"
import { AdminService } from "@/services/admin.service"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Shield, GraduationCap, UserCog, Upload, Loader2, Download } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import Papa from 'papaparse'

const users = [
    { id: "1", name: "Alice Student", email: "alice@gradeloop.com", role: "STUDENT", status: "Active" },
    { id: "2", name: "Bob Student", email: "bob@gradeloop.com", role: "STUDENT", status: "Active" },
    { id: "3", name: "Dr. Sarah", email: "sarah@gradeloop.com", role: "INSTRUCTOR", status: "Active" },
    { id: "4", name: "Admin User", email: "admin@gradeloop.com", role: "ADMIN", status: "Active" },
    { id: "5", name: "John Doe", email: "john@gradeloop.com", role: "STUDENT", status: "Inactive" },
]

export default function UserManagementPage() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)

    const bulkCreateMutation = useMutation({
        mutationFn: (data: any[]) => AdminService.bulkCreateStudents(data),
        onSuccess: (data, variables) => {
            toast.success(`Successfully queued ${variables.length} users for creation`)
            setIsUploading(false)
        },
        onError: () => {
            toast.error("Failed to import users")
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
                // Reset input
                if (fileInputRef.current) fileInputRef.current.value = ""
            },
            error: (error) => {
                toast.error(`CSV Parsing Error: ${error.message}`)
                setIsUploading(false)
            }
        })
    }

    const handleDownloadTemplate = () => {
        const headers = ["name", "email", "studentId", "role"]
        const rows = [
            ["John Doe", "john.doe@example.com", "IT210001", "STUDENT"],
            ["Jane Smith", "jane.smith@example.com", "IT210002", "STUDENT"]
        ]

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", "students_template.csv")
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">Manage system access and roles.</p>
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
                        Import from CSV
                    </Button>
                    <Button variant="outline" onClick={handleDownloadTemplate}>
                        <Download className="mr-2 h-4 w-4" /> Template
                    </Button>
                    <Button>Add User</Button>
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Avatar</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <Avatar>
                                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{user.name}</span>
                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {user.role === 'ADMIN' && <Shield className="h-4 w-4 text-red-500" />}
                                        {user.role === 'INSTRUCTOR' && <UserCog className="h-4 w-4 text-purple-500" />}
                                        {user.role === 'STUDENT' && <GraduationCap className="h-4 w-4 text-blue-500" />}
                                        <span className="text-sm capitalize font-medium">{user.role.toLowerCase()}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.status === 'Active' ? 'default' : 'secondary'} className={user.status === 'Active' ? "bg-green-600 hover:bg-green-700" : ""}>
                                        {user.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                                                Copy ID
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                                            <DropdownMenuItem>Edit Role</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600">Deactivate User</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
