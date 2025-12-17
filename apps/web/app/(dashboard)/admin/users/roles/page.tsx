"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AdminService, Role, Permission } from "@/services/admin.service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Plus, Shield, Users } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export default function RolesManagementPage() {
    const queryClient = useQueryClient()
    const { data: roles, isLoading: rolesLoading } = useQuery({
        queryKey: ['admin-roles'],
        queryFn: AdminService.getAllRoles
    })
    const { data: permissions, isLoading: permissionsLoading } = useQuery({
        queryKey: ['admin-permissions'],
        queryFn: AdminService.getAllPermissions
    })

    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newRoleName, setNewRoleName] = useState("")
    const [newRoleDesc, setNewRoleDesc] = useState("")
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

    const createRoleMutation = useMutation({
        mutationFn: (data: { name: string; description: string; permissions: string[] }) =>
            AdminService.createRole(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-roles'] })
            toast.success("Role created successfully")
            setIsCreateOpen(false)
            setNewRoleName("")
            setNewRoleDesc("")
            setSelectedPermissions([])
        }
    })

    const handlePermissionToggle = (permId: string) => {
        setSelectedPermissions(prev =>
            prev.includes(permId)
                ? prev.filter(id => id !== permId)
                : [...prev, permId]
        )
    }

    const handleCreateRole = () => {
        if (!newRoleName) return;
        createRoleMutation.mutate({
            name: newRoleName,
            description: newRoleDesc,
            permissions: selectedPermissions
        })
    }

    // Group permissions by module
    const permissionsByModule = permissions?.reduce((acc, perm) => {
        if (!acc[perm.module]) acc[perm.module] = []
        acc[perm.module].push(perm)
        return acc
    }, {} as Record<string, Permission[]>)

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
                    <p className="text-muted-foreground">Define roles and assign access controls.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Create Role
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>System Roles</CardTitle>
                    <CardDescription>
                        List of active roles and their associated user counts.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Permissions</TableHead>
                                <TableHead>Users</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rolesLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell>
                                </TableRow>
                            ) : (
                                roles?.map(role => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-4 w-4 text-muted-foreground" />
                                                {role.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{role.description}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1 flex-wrap">
                                                {role.permissions.slice(0, 3).map(pId => (
                                                    <Badge key={pId} variant="secondary" className="text-xs">
                                                        {permissions?.find(p => p.id === pId)?.name || pId}
                                                    </Badge>
                                                ))}
                                                {role.permissions.length > 3 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{role.permissions.length - 3} more
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Users className="h-4 w-4" />
                                                {role.userCount}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Edit</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create New Role</DialogTitle>
                        <DialogDescription>Define a new role and select its permissions.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="roleName">Role Name</Label>
                            <Input
                                id="roleName"
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                                placeholder="e.g. Content Moderator"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="roleDesc">Description</Label>
                            <Input
                                id="roleDesc"
                                value={newRoleDesc}
                                onChange={(e) => setNewRoleDesc(e.target.value)}
                                placeholder="Brief description of responsibilities"
                            />
                        </div>

                        <div className="space-y-4">
                            <Label>Permissions</Label>
                            <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg h-[300px] overflow-y-auto">
                                {permissionsByModule && Object.entries(permissionsByModule).map(([module, perms]) => (
                                    <div key={module} className="space-y-2">
                                        <h4 className="font-semibold capitalize text-sm text-foreground/80 flex items-center gap-2">
                                            {module}
                                            <div className="h-px bg-border flex-1" />
                                        </h4>
                                        <div className="space-y-2">
                                            {perms.map(perm => (
                                                <div key={perm.id} className="flex items-start space-x-2">
                                                    <Checkbox
                                                        id={perm.id}
                                                        checked={selectedPermissions.includes(perm.id)}
                                                        onCheckedChange={() => handlePermissionToggle(perm.id)}
                                                    />
                                                    <div className="grid gap-1.5 leading-none">
                                                        <label
                                                            htmlFor={perm.id}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                        >
                                                            {perm.name}
                                                        </label>
                                                        <p className="text-xs text-muted-foreground">
                                                            {perm.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateRole} disabled={createRoleMutation.isPending}>
                            {createRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
