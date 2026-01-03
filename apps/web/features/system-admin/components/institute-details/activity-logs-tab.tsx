import { useInstituteLogs } from "../../api/queries"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"

interface ActivityLogsTabProps {
    instituteId: string
}

export function ActivityLogsTab({ instituteId }: ActivityLogsTabProps) {
    const { data: logs, isLoading } = useInstituteLogs(instituteId)

    if (isLoading) return <div>Loading logs...</div>

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Details</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs?.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell className="text-xs whitespace-nowrap">
                                {format(new Date(log.timestamp), "MMM dd, yyyy HH:mm")}
                            </TableCell>
                            <TableCell className="font-medium text-xs">{log.user}</TableCell>
                            <TableCell className="text-xs font-semibold">{log.action}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{log.details}</TableCell>
                        </TableRow>
                    ))}
                    {(!logs || logs.length === 0) && (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                No activity logs found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
