"use client"

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../../components/ui/table"
import { Input } from "../../../components/ui/input"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../../../components/ui/alert-dialog"
import { Institute } from "../types"
import { MoreHorizontal, Search, Eye, Edit, Trash2, Ban, CheckCircle } from "lucide-react"
import { useSystemAdminStore } from "../store/use-system-admin-store"
import { useDeleteInstitute, useUpdateInstitute } from "../../../hooks/institute"
import { toast } from "sonner"

interface InstituteTableProps {
    institutes: Institute[]
}

export function InstituteTable({ institutes }: InstituteTableProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [instituteToDelete, setInstituteToDelete] = useState<Institute | null>(null)

    const filteredInstitutes = institutes.filter((i) =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.code.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const setSelectedInstituteId = useSystemAdminStore((state) => state.setSelectedInstituteId)
    const setDetailsModalOpen = useSystemAdminStore((state) => state.setDetailsModalOpen)
    const setEditModalOpen = useSystemAdminStore((state) => state.setEditModalOpen)

    const deleteInstitute = useDeleteInstitute()
    const updateInstitute = useUpdateInstitute()

    const handleDeleteClick = (institute: Institute) => {
        setInstituteToDelete(institute)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!instituteToDelete?.id) return

        try {
            await deleteInstitute.mutateAsync(instituteToDelete.id)
            toast.success(`${instituteToDelete.name} has been deleted successfully`)
            setDeleteDialogOpen(false)
            setInstituteToDelete(null)
        } catch (error) {
            toast.error("Failed to delete institute. Please try again.")
        }
    }

    const handleEditClick = (institute: Institute) => {
        setSelectedInstituteId(institute.id!)
        setEditModalOpen(true)
    }

    const handleToggleStatus = async (institute: Institute) => {
        const newStatus = institute.status === "active" ? "inactive" : "active"
        const action = newStatus === "active" ? "activated" : "deactivated"

        try {
            await updateInstitute.mutateAsync({
                id: institute.id!,
                data: {
                    ...institute,
                    status: newStatus,
                },
            })
            toast.success(`${institute.name} has been ${action} successfully`)
        } catch (error) {
            toast.error(`Failed to ${action.slice(0, -1)} institute. Please try again.`)
        }
    }

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search institutes..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Institute</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Admins</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInstitutes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No institutes found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredInstitutes.map((institute) => (
                                    <TableRow key={institute.id}>
                                        <TableCell>
                                            <div className="font-medium">{institute.name}</div>
                                            <div className="text-xs text-muted-foreground">{institute.domain}</div>
                                        </TableCell>
                                        <TableCell>{institute.code}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    institute.status === "active"
                                                        ? "success"
                                                        : institute.status === "inactive"
                                                            ? "destructive"
                                                            : "warning"
                                                }
                                                className="capitalize"
                                            >
                                                {institute.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{institute.admins.length}</TableCell>
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
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedInstituteId(institute.id!)
                                                            setDetailsModalOpen(true)
                                                        }}
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" /> View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEditClick(institute)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit Institute
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleToggleStatus(institute)}
                                                        disabled={updateInstitute.isPending}
                                                    >
                                                        {institute.status === "active" ? (
                                                            <>
                                                                <Ban className="mr-2 h-4 w-4" /> Deactivate
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="mr-2 h-4 w-4" /> Activate
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => handleDeleteClick(institute)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Institute
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete{" "}
                            <span className="font-semibold">{instituteToDelete?.name}</span> and remove all
                            associated data from the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteInstitute.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
