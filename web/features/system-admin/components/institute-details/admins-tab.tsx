import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InstituteAdmin } from "../../types"
import { Mail, ShieldCheck, UserMinus } from "lucide-react"
import { AddAdminDialog } from "./add-admin-dialog"

interface AdminsTabProps {
    admins: InstituteAdmin[]
    instituteId: string // Need this ID
    onRefresh?: () => void
}

export function AdminsTab({ admins, instituteId, onRefresh }: AdminsTabProps) {
    const [isAddAdminOpen, setIsAddAdminOpen] = useState(false)

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Institute Administrators</h3>
                <Button size="sm" onClick={() => setIsAddAdminOpen(true)}>Add Admin</Button>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Admin Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {admins.map((admin) => (
                            <TableRow key={admin.id}>
                                <TableCell className="font-medium">{admin.name}</TableCell>
                                <TableCell>{admin.email}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="capitalize">
                                        {admin.role}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="icon" title="Resend Invite">
                                        <Mail className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive">
                                        <UserMinus className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <AddAdminDialog
                open={isAddAdminOpen}
                onOpenChange={setIsAddAdminOpen}
                instituteId={instituteId}
                onSuccess={() => {
                    // Refresh or optimistic update
                    if (onRefresh) onRefresh();
                }}
            />
        </div>
    )
}

