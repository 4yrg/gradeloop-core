'use client';

import {
    Star,
    MessageSquare,
    History,
    CheckCircle2,
    XCircle,
    ArrowUpRight,
    User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function GradeReviewPage() {
    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Grade Review & Appeals</h2>
                    <p className="text-muted-foreground">Manage student appeals and manual re-grading history.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">Export History</Button>
                    <Badge variant="secondary" className="px-3">8 Pending Appeals</Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Active Appeals</h3>
                    {[
                        { student: "Alice Johnson", original: 75, requested: 85, reason: "I believe my complexity analysis in Question 2 should receive partial marks as explained in the viva.", status: "Pending" },
                        { student: "Bob Smith", original: 42, requested: 55, reason: "The autograder failed due to a small syntax error that doesn't affect the core logic.", status: "Processing" },
                    ].map((appeal, i) => (
                        <Card key={i} className="overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/20">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{appeal.student}</p>
                                        <p className="text-[10px] text-muted-foreground">Submitted 1 day ago</p>
                                    </div>
                                </div>
                                <Badge variant={appeal.status === 'Pending' ? 'outline' : 'secondary'}>{appeal.status}</Badge>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="px-3 py-1 rounded bg-muted">Original: <span className="font-bold">{appeal.original}</span></div>
                                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                                    <div className="px-3 py-1 rounded bg-primary/10 text-primary">Requested: <span className="font-bold">{appeal.requested}</span></div>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed italic">
                                    "{appeal.reason}"
                                </p>
                                <Separator />
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost">View Submission</Button>
                                    <Button size="sm" variant="outline" className="text-destructive">Reject</Button>
                                    <Button size="sm">Update Grade</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="space-y-6">
                    <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Audit Trail</h3>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <History className="h-4 w-4" />
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[400px]">
                                <div className="space-y-4 text-sm">
                                    {[
                                        { user: "Instructor (Me)", action: "Updated grade for Diana Prince", detail: "88 → 92 (Approved appeal)", time: "2h ago" },
                                        { user: "System", action: "Automatic re-grade (Autograder fix)", detail: "Impacted 12 submissions", time: "5h ago" },
                                        { user: "Instructor (Me)", action: "Rejected appeal for Charlie Brown", detail: "Reason: Insufficient explanation", time: "1d ago" },
                                        { user: "Admin", action: "Adjusted weight for Question 3", detail: "15% → 20%", time: "2d ago" },
                                    ].map((log, i) => (
                                        <div key={i} className="relative pl-4 border-l pb-4 last:pb-0">
                                            <div className="absolute left-[-5px] top-1 h-2 w-2 rounded-full bg-muted-foreground/30" />
                                            <p className="font-medium text-[12px]">{log.action}</p>
                                            <p className="text-[10px] text-muted-foreground">{log.detail}</p>
                                            <p className="text-[10px] text-muted-foreground mt-1">{log.time} by {log.user}</p>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
