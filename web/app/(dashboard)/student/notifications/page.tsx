"use client";

import { Bell, CheckCircle2, Clock, Info, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function NotificationsPage() {
    const notifications = [
        {
            id: 1,
            title: "Grading Completed",
            description: "Your submission for 'Data Structures: AVL Trees' has been graded.",
            time: "2 hours ago",
            type: "grading",
            unread: true,
        },
        {
            id: 2,
            title: "New Hint Available",
            description: "The instructor added a new conceptual hint for Assignment 3.",
            time: "5 hours ago",
            type: "info",
            unread: false,
        },
        {
            id: 3,
            title: "Deadline Reminder",
            description: "Assignment 2: Dynamic Programming is due in 24 hours.",
            time: "1 day ago",
            type: "warning",
            unread: false,
        },
    ];

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-4xl mx-auto w-full px-4">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Bell className="h-8 w-8 text-primary" />
                    Notifications
                </h1>
                <Button variant="outline" size="sm">Mark all as read</Button>
            </div>

            <div className="space-y-4">
                {notifications.map((n) => (
                    <Card key={n.id} className={n.unread ? "border-primary/30 bg-primary/5" : ""}>
                        <CardContent className="p-4 flex items-start gap-4">
                            <div className="bg-background p-2 rounded-lg border shadow-sm">
                                {n.type === 'grading' ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Info className="h-5 w-5 text-blue-500" />}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between">
                                    <p className="font-bold text-sm">{n.title}</p>
                                    <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {n.time}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{n.description}</p>
                                <div className="pt-2 flex gap-2">
                                    <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 uppercase font-bold tracking-widest">View Details</Button>
                                    {n.unread && <Badge className="h-5">New</Badge>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
