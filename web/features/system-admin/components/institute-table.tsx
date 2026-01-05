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
import { Progress } from "../../../components/ui/progress"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu"
import { Institute } from "../types"
import { MoreHorizontal, Search, Eye, Edit, Trash2 } from "lucide-react"
import { useSystemAdminStore } from "../store/use-system-admin-store"

interface InstituteTableProps {
    institutes: Institute[]
}

export function InstituteTable({ institutes }: InstituteTableProps) {
    const [searchQuery, setSearchQuery] = useState("")

    const filteredInstitutes = institutes.filter((i) =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.code.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const setSelectedInstituteId = useSystemAdminStore((state) => state.setSelectedInstituteId)
    const setDetailsModalOpen = useSystemAdminStore((state) => state.setDetailsModalOpen)

    return (
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
                            <TableHead>Setup Progress</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredInstitutes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
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
                                    <TableCell>
                                        <div className="flex items-center gap-2 max-w-[150px]">
                                            <Progress value={institute.setupProgress} className="h-2" />
                                            <span className="text-xs whitespace-nowrap">{institute.setupProgress}%</span>
                                        </div>
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
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSelectedInstituteId(institute.id!)
                                                        setDetailsModalOpen(true)
                                                    }}
                                                >
                                                    <Eye className="mr-2 h-4 w-4" /> View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit Institute
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive">
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
    )
}
