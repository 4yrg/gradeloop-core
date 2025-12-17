"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell } from "lucide-react"

interface Announcement {
    id: string
    title: string
    course: string
    date: string
    content: string
}

interface AnnouncementsWidgetProps {
    announcements: Announcement[]
}

export function AnnouncementsWidget({ announcements }: AnnouncementsWidgetProps) {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Announcements
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {announcements.map((item) => (
                        <div
                            key={item.id}
                            className="flex flex-col space-y-1 rounded-md border p-3 text-sm"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-primary">{item.course}</span>
                                <span className="text-xs text-muted-foreground">{item.date}</span>
                            </div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {item.content}
                            </p>
                        </div>
                    ))}
                    {announcements.length === 0 && (
                        <p className="text-sm text-muted-foreground">No new announcements</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
