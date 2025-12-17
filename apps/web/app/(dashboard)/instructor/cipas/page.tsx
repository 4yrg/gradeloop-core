"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, AlertTriangle, TrendingUp } from "lucide-react"

export default function CIPASPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">CIPAS</h1>
                <p className="text-muted-foreground">Code Integrity & Provenance Analysis System</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Plagiarism Detection
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">8</div>
                        <p className="text-sm text-muted-foreground">Flagged submissions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            AI-Generated Code
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">3</div>
                        <p className="text-sm text-muted-foreground">Suspected cases</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Avg Similarity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">15.5%</div>
                        <p className="text-sm text-muted-foreground">Across all submissions</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>CIPAS Dashboard</CardTitle>
                    <CardDescription>Comprehensive plagiarism and AI detection coming soon</CardDescription>
                </CardHeader>
                <CardContent className="py-12 text-center text-muted-foreground">
                    <Shield className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>Full CIPAS implementation in progress</p>
                    <p className="text-sm mt-2">Features: Diff viewer, similarity reports, student profiles</p>
                </CardContent>
            </Card>
        </div>
    )
}
