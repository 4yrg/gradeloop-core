"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "motion/react"
import { adminService } from "@/services/admin.service"
import { AdminSidebar } from "@/components/sidebar/admin-sidebar"
import { PERMISSIONS, Role } from "@/types/role"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Save, Shield } from "lucide-react"
import { toast } from "sonner"

export default function RolesPage() {
    const queryClient = useQueryClient()
    const [selectedRole, setSelectedRole] = useState<string>("student")

    // Track changes locally before saving
    const [pendingChanges, setPendingChanges] = useState<Record<string, string[]>>({})

    const { data: roles, isLoading } = useQuery({
        queryKey: ["roles"],
        queryFn: adminService.getRoles,
    })

    // Helper to get active permissions for UI (merging server state with local pending changes)
    const getRolePermissions = (roleId: string) => {
        if (pendingChanges[roleId]) return pendingChanges[roleId]
        return roles?.find(r => r.id === roleId)?.permissions || []
    }

    const handlePermissionToggle = (roleId: string, permissionId: string) => {
        const currentPermissions = getRolePermissions(roleId)
        let newPermissions
        if (currentPermissions.includes(permissionId)) {
            newPermissions = currentPermissions.filter(p => p !== permissionId)
        } else {
            newPermissions = [...currentPermissions, permissionId]
        }

        setPendingChanges(prev => ({
            ...prev,
            [roleId]: newPermissions
        }))
    }

    const saveMutation = useMutation({
        mutationFn: async () => {
            const promises = Object.entries(pendingChanges).map(([roleId, perms]) =>
                adminService.updateRolePermissions(roleId, perms)
            )
            await Promise.all(promises)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["roles"] })
            setPendingChanges({})
            toast.success("Role permissions updated successfully")
        }
    })

    if (isLoading) {
        return (
            <div className="flex">
                <div className="hidden w-64 md:block"><Skeleton className="h-screen w-full" /></div>
                <div className="flex-1 p-8 space-y-4">
                    <Skeleton className="h-10 w-48" />
                    <div className="flex gap-4">
                        <Skeleton className="h-96 w-64" />
                        <Skeleton className="h-96 flex-1" />
                    </div>
                </div>
            </div>
        )
    }

    const activeRoleData = roles?.find(r => r.id === selectedRole)

    // Group permissions by category
    const permissionsByCategory = PERMISSIONS.reduce((acc, curr) => {
        if (!acc[curr.category]) acc[curr.category] = []
        acc[curr.category].push(curr)
        return acc
    }, {} as Record<string, typeof PERMISSIONS>)

    return (
        <div className="flex min-h-screen">
            <div className="hidden w-64 md:block">
                <AdminSidebar className="fixed inset-y-0 w-64" />
            </div>

            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden absolute top-4 left-4 z-50">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 border-r-0 w-64">
                    <AdminSidebar />
                </SheetContent>
            </Sheet>

            <main className="flex-1 md:ml-64 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="container mx-auto p-4 md:p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
                            <p className="text-muted-foreground">Manage system access levels and role capabilities.</p>
                        </div>
                        {Object.keys(pendingChanges).length > 0 && (
                            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Role List */}
                        <div className="w-full lg:w-64 space-y-2">
                            {roles?.map(role => (
                                <div
                                    key={role.id}
                                    onClick={() => setSelectedRole(role.id)}
                                    className={cn(
                                        "cursor-pointer rounded-lg border p-4 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                                        selectedRole === role.id ? "bg-white dark:bg-slate-950 border-primary shadow-sm ring-1 ring-primary" : "bg-card"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold">{role.name}</span>
                                        <Badge variant="secondary" className="text-xs">{role.usersCount} users</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{role.description}</p>
                                </div>
                            ))}
                        </div>

                        {/* Permission Matrix for Selected Role */}
                        <motion.div
                            className="flex-1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={selectedRole} // Re-animate on role change
                        >
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-primary" />
                                        <CardTitle>{activeRoleData?.name} Permissions</CardTitle>
                                    </div>
                                    <CardDescription>
                                        Toggle the capabilities allowed for this role.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {Object.entries(permissionsByCategory).map(([category, perms]) => (
                                        <div key={category} className="space-y-3">
                                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{category}</h3>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                {perms.map(permission => {
                                                    const activePerms = getRolePermissions(selectedRole)
                                                    const isChecked = activePerms.includes(permission.id)

                                                    return (
                                                        <div key={permission.id} className="flex items-center space-x-4 rounded-md border p-4">
                                                            <Switch
                                                                checked={isChecked}
                                                                onCheckedChange={() => handlePermissionToggle(selectedRole, permission.id)}
                                                            />
                                                            <div className="flex-1 space-y-1">
                                                                <p className="text-sm font-medium leading-none">{permission.name}</p>
                                                                <p className="text-xs text-muted-foreground">{permission.description}</p>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    )
}
