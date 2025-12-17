"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, CheckCircle2, AlertCircle } from "lucide-react"

export default function ACAFSPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">ACAFS</h1>
                <p className="text-muted-foreground">Automated Code Assessment & Feedback System</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" />
                            Auto-Graded
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">120</div>
                        <p className="text-sm text-muted-foreground">Submissions processed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            AI Accuracy
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">92.5%</div>
                        <p className="text-sm text-muted-foreground">Average accuracy</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Needs Review
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">8</div>
                        <p className="text-sm text-muted-foreground">Interventions required</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>ACAFS Dashboard</CardTitle>
                    <CardDescription>AI-powered assessment and feedback coming soon</CardDescription>
                </CardHeader>
                <CardContent className="py-12 text-center text-muted-foreground">
                    <Brain className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>Full ACAFS implementation in progress</p>
                    <p className="text-sm mt-2">Features: Auto-grading, AI feedback, interaction logs</p>
                </CardContent>
            </Card>
        </div>
    )
}
