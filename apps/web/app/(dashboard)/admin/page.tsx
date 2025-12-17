"use client"

import { useQuery } from "@tanstack/react-query"
import { AdminService } from "@/services/admin.service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Upload, Users, Server, Activity, Download, Plus, Search, FileSpreadsheet } from "lucide-react"

export default function AdminDashboard() {

    // Mock Data
    const { data: stats } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: AdminService.getSystemStats
    })

    const { data: users } = useQuery({
        queryKey: ['admin-users'],
        queryFn: AdminService.getAllUsers
    })

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Administration</h1>
                <p className="text-muted-foreground">Manage users, academic structure, and system configurations.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalUsers || "..."}</div>
                        <p className="text-xs text-muted-foreground">+180 from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.activeCourses || "..."}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Submissions Today</CardTitle>
                        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.submissionsToday || "..."}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Health</CardTitle>
                        <Server className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats?.systemHealth || "..."}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Admin Management Tabs */}
            <Tabs defaultValue="users" className="w-full">
                <TabsList>
                    <TabsTrigger value="users">User Management</TabsTrigger>
                    <TabsTrigger value="academic">Academic Structure</TabsTrigger>
                    <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
                    <TabsTrigger value="integrations">Integrations</TabsTrigger>
                </TabsList>

                {/* USERS TAB */}
                <TabsContent value="users" className="mt-6 space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-4 border rounded-lg bg-card">
                        <div className="space-y-1">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Upload className="h-5 w-5" /> Batch User Import
                            </h3>
                            <p className="text-sm text-muted-foreground">Upload an Excel file to add users in bulk.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Template</Button>
                            <Button><Upload className="mr-2 h-4 w-4" /> Upload Excel</Button>
                        </div>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>All Users</CardTitle>
                                <CardDescription>Manage individual user accounts.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Input placeholder="Search users..." className="w-[250px]" />
                                <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add User</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users?.map((u: any) => (
                                        <TableRow key={u.id}>
                                            <TableCell className="font-medium">{u.name}</TableCell>
                                            <TableCell>{u.email}</TableCell>
                                            <TableCell className="capitalize">{u.role}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">Edit</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ACADEMIC TAB (Placeholder for structure) */}
                <TabsContent value="academic" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Academic Hierarchy</CardTitle>
                            <CardDescription>Manage Faculties, Batches, and Specializations.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-center py-12 text-muted-foreground">
                                Tree View Component Placeholder
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
