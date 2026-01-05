'use client';

import {
    Zap,
    Check,
    X,
    Info,
    RefreshCcw,
    MessageSquare,
    ExternalLink
} from "lucide-react";
import { Button } from "../../../../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../../../../../components/ui/card";
import { Badge } from "../../../../../../../../components/ui/badge";
import { ScrollArea } from "../../../../../../../../components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../../../../../../../components/ui/table";

export default function AutogradeRequestsPage() {
    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Autograde Requests</h2>
                    <p className="text-muted-foreground">Manage student requests for manual autograder re-runs.</p>
                </div>
                <Button size="sm">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Process All Pending
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pending Requests</CardTitle>
                    <CardDescription>Review student reasons for re-grading before approval.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Submission ID</TableHead>
                                <TableHead className="w-[300px]">Reason</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[
                                { student: "Alice Johnson", id: "sub_9281", reason: "Environment timeout during hidden tests, code is correct.", time: "10m ago" },
                                { student: "Bob Smith", id: "sub_8172", reason: "Accidentally uploaded wrong version, but logic matches previous.", time: "2h ago" },
                                { student: "Charlie Brown", id: "sub_7651", reason: "Autograder failed on Type mismatch but it passes locally.", time: "5h ago" },
                            ].map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{req.student}</span>
                                            <span className="text-[10px] text-muted-foreground">CS21001</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{req.id}</TableCell>
                                    <TableCell>
                                        <p className="text-xs italic">"{req.reason}"</p>
                                    </TableCell>
                                    <TableCell className="text-xs">{req.time}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="icon" className="h-8 w-8 text-green-500">
                                                <RefreshCcw className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="icon" className="h-8 w-8 text-destructive">
                                                <X className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MessageSquare className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Info className="h-4 w-4 text-blue-500" />
                            Request Policy
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground space-y-2">
                        <p>• Students are limited to 3 autograde requests per assignment.</p>
                        <p>• Re-runs consume shared compute credits.</p>
                        <p>• Denied requests do not refund the student's limit.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            Auto-Approval Logic
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
                        <p>Approve if system latency {'>'} 5s during submission</p>
                        <Badge>Inactive</Badge>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
