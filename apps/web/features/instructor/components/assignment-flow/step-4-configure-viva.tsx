"use client"

import * as React from "react"
import { Mic, Video } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function Step4ConfigureViva() {
    return (
        <div className="flex flex-col h-full items-center justify-center p-8 gap-4 text-center max-w-2xl mx-auto">
            <div className="p-4 bg-muted rounded-full flex gap-2">
                <Mic className="h-10 w-10 text-primary" />
                <Video className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Viva Configuration</h2>
                <p className="text-muted-foreground">
                    Set up automated or manual viva sessions for students to explain their code.
                </p>
            </div>
            <Card className="w-full mt-6 bg-muted/20 border-dashed">
                <CardContent className="py-10 flex flex-col items-center gap-4">
                    <p className="font-medium">Coming Soon</p>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        AI-driven viva questions and scheduling tools are under development.
                    </p>
                    <Button disabled variant="outline">Configure Viva Rules</Button>
                </CardContent>
            </Card>
        </div>
    )
}
