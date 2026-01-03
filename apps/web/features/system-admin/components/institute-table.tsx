"use client"

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Institute } from "../types"
import { MoreHorizontal, Search, ExternalLink } from "lucide-react"
import Link from "next/link"

interface InstituteTableProps {
    institutes: Institute[]
}

export function InstituteTable({ institutes }: InstituteTableProps) {
    const [searchQuery, setSearchQuery] = useState("")

    const filteredInstitutes = institutes.filter((i) =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.code.toLowerCase().includes(searchQuery.toLowerCase())
    )

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
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-24 rounded-full bg-secondary overflow-hidden">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{ width: `${institute.setupProgress}%` }}
                                                />
                                            </div>
                                            <span className="text-xs">{institute.setupProgress}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/system-admin/institutes/${institute.id}`}>
                                                <ExternalLink className="h-4 w-4" />
                                            </Link>
                                        </Button>
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
