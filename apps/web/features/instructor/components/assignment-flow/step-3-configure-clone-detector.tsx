"use client"

import * as React from "react"
import { Copy, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function Step3ConfigureCloneDetector() {
    return (
        <div className="flex flex-col h-full items-center justify-center p-8 gap-4 text-center max-w-2xl mx-auto">
            <div className="p-4 bg-muted rounded-full">
                <Copy className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Clone Detector Configuration</h2>
                <p className="text-muted-foreground">
                    Detect plagiarism and code similarity across all submissions.
                    Configure thresholds and exclusion rules here.
                </p>
            </div>

            <Card className="w-full mt-6 bg-muted/20 border-dashed">
                <CardContent className="py-10 flex flex-col items-center gap-4">
                    <p className="font-medium">Coming Soon</p>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        The clone detector features are being finalized. Check back later for threshold settings and whitelist configuration.
                    </p>
                    <Button disabled variant="outline">Enable Clone Detection</Button>
                </CardContent>
            </Card>
        </div>
    )
}
