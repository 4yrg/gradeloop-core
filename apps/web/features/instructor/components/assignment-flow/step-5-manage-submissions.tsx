"use client"

import * as React from "react"
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
import { Search, Filter, MoreHorizontal, FileText, CheckCircle2, XCircle, Clock } from "lucide-react"

interface Submission {
    id: string
    studentName: string
    studentId: string
    status: "graded" | "pending" | "failed" | "late"
    submittedAt: string
    score?: number
    commitHash: string
}

const mockSubmissions: Submission[] = [
    { id: "1", studentName: "Alice Johnson", studentId: "IT21001", status: "graded", submittedAt: "Oct 10, 10:23 AM", score: 95, commitHash: "7a8b9c" },
    { id: "2", studentName: "Bob Smith", studentId: "IT21002", status: "pending", submittedAt: "Oct 10, 11:45 AM", commitHash: "e2f3g4" },
    { id: "3", studentName: "Charlie Brown", studentId: "IT21003", status: "failed", submittedAt: "Oct 11, 09:15 AM", commitHash: "h5i6j7" },
    { id: "4", studentName: "Diana Prince", studentId: "IT21004", status: "late", submittedAt: "Oct 12, 08:30 AM", score: 88, commitHash: "k8l9m0" },
    { id: "5", studentName: "Evan Wright", studentId: "IT21005", status: "graded", submittedAt: "Oct 10, 02:20 PM", score: 100, commitHash: "n1o2p3" },
]

export function Step5ManageSubmissions() {
    return (
        <div className="flex flex-col h-full p-8 max-w-7xl mx-auto w-full gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Manage Submissions</h2>
                    <p className="text-muted-foreground">View and manage student submissions for this assignment.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                    <Button variant="outline" size="sm">
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search students..."
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="border rounded-md bg-background">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-muted/50">
                            <TableHead className="w-[300px]">Student</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Submitted At</TableHead>
                            <TableHead>Commit</TableHead>
                            <TableHead className="text-right">Score</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockSubmissions.map((submission) => (
                            <TableRow key={submission.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{submission.studentName}</span>
                                        <span className="text-xs text-muted-foreground">{submission.studentId}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={submission.status} />
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {submission.submittedAt}
                                </TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <FileText className="h-3 w-3" />
                                        {submission.commitHash}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {submission.score !== undefined ? (
                                        <span>{submission.score}/100</span>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: Submission["status"] }) {
    switch (status) {
        case "graded":
            return (
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full w-fit border border-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Graded
                </div>
            )
        case "pending":
            return (
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full w-fit border border-amber-200">
                    <Clock className="h-3.5 w-3.5" />
                    Pending
                </div>
            )
        case "failed":
            return (
                <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full w-fit border border-red-200">
                    <XCircle className="h-3.5 w-3.5" />
                    Failed
                </div>
            )
        case "late":
            return (
                <div className="flex items-center gap-1.5 text-xs font-medium text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full w-fit border border-purple-200">
                    <Clock className="h-3.5 w-3.5" />
                    Late
                </div>
            )
        default:
            return null
    }
}
