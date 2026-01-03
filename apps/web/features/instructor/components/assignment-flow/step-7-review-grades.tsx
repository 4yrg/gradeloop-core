"use client"

import * as React from "react"
import { BarChart3, Send } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function Step7ReviewGrades() {
    return (
        <div className="flex flex-col h-full items-center justify-center p-8 gap-4 text-center max-w-2xl mx-auto">
            <div className="p-4 bg-muted rounded-full">
                <BarChart3 className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Review & Release Grades</h2>
                <p className="text-muted-foreground">
                    Analyze class performance and publish grades to students.
                </p>
            </div>
            <Card className="w-full mt-6 bg-muted/20 border-dashed">
                <CardContent className="py-10 flex flex-col items-center gap-4">
                    <p className="font-medium">Coming Soon</p>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        Grade distribution charts and release controls will be available here.
                    </p>
                    <Button disabled className="gap-2">
                        <Send className="h-4 w-4" />
                        Release Grades
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
