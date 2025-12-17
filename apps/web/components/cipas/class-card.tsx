"use client"

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, FileText, ArrowRight, Clock } from "lucide-react"
import Link from "next/link"
import { Classroom } from "@/types/instructor"

interface ClassCardProps {
    classroom: Classroom
}

export function ClassCard({ classroom }: ClassCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex flex-col">
                    <CardTitle className="text-lg font-bold">{classroom.code}</CardTitle>
                    <span className="text-xs text-muted-foreground">{classroom.name}</span>
                </div>
                <Badge variant="secondary">{classroom.semester}</Badge>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 py-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{classroom.studentCount} Students</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{classroom.activeAssignments} Active Assignments</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Next Class: {classroom.nextClass}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button asChild variant="outline" className="w-full justify-between">
                    <Link href={`/instructor/classes/${classroom.id}`}>
                        Manage Class <ArrowRight className="h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
