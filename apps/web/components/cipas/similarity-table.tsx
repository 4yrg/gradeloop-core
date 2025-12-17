"use client"

import { useState } from "react"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Eye, MoreHorizontal, Flag, CheckCircle, XCircle } from "lucide-react"
import { PlagiarismReport } from "@/types/cipas"
import { cipasService } from "@/services/cipas.service"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface SimilarityTableProps {
    reports: PlagiarismReport[]
}

const getSimilarityColor = (score: number) => {
    if (score >= 80) return "bg-red-500"
    if (score >= 50) return "bg-amber-500"
    return "bg-green-500"
}

export function SimilarityTable({ reports }: SimilarityTableProps) {
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: PlagiarismReport['status'] }) =>
            cipasService.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cipas-reports"] })
            toast.success("Report status updated")
        }
    })

    // Group matched sources unique string for display
    const getSourcesSummary = (report: PlagiarismReport) => {
        if (report.matchedSources.length === 0) return "No matches"
        const topMatch = report.matchedSources.sort((a, b) => b.similarity - a.similarity)[0]
        return `${topMatch.sourceName} (${topMatch.cloneType})`
    }

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Assignment</TableHead>
                        <TableHead className="w-[200px]">Similarity</TableHead>
                        <TableHead>Top Match</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reports.map((report) => (
                        <TableRow key={report.id}>
                            <TableCell className="font-medium">
                                {report.studentName}
                            </TableCell>
                            <TableCell>
                                {report.assignmentTitle}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <span className="w-8 text-right text-sm font-medium">{report.totalSimilarity}%</span>
                                    <Progress
                                        value={report.totalSimilarity}
                                        className="h-2 w-24"
                                        // Note: shadcn Progress color customization might need custom class or utility
                                        indicatorClassName={getSimilarityColor(report.totalSimilarity)}
                                    />
                                </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {getSourcesSummary(report)}
                            </TableCell>
                            <TableCell>
                                <Badge variant={
                                    report.status === 'Flagged' ? "destructive" :
                                        report.status === 'Resolved' ? "outline" : "default"
                                }>
                                    {report.status}
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
                                        <DropdownMenuItem asChild>
                                            <Link href={`/instructor/classes/1/cipas/${report.id}`}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                View Comparison
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => mutation.mutate({ id: report.id, status: 'Flagged' })}>
                                            <Flag className="mr-2 h-4 w-4" />
                                            Flag as Plagiarism
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => mutation.mutate({ id: report.id, status: 'Resolved' })}>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Mark Resolved
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => mutation.mutate({ id: report.id, status: 'Ignored' })}>
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Ignore
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    {reports.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                No plagiarism reports found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
