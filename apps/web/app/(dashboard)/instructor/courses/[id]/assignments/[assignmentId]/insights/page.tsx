'use client';

import {
    BarChart3,
    TrendingUp,
    Target,
    AlertCircle,
    Users,
    Zap,
    MessageSquare,
    ShieldAlert
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

export default function InsightsPage() {
    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Statistics & Analytics</h2>
                    <p className="text-muted-foreground">Comprehensive insights into student performance and integrity trends.</p>
                </div>
                <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Batch" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Sections</SelectItem>
                        <SelectItem value="s1">Section A</SelectItem>
                        <SelectItem value="s2">Section B</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Avg. Score", value: "72.4", trend: "+2.1", icon: Target },
                    { label: "Completion", value: "85%", trend: "+5%", icon: Users },
                    { label: "Avg. Attempts", value: "2.4", trend: "-0.2", icon: Zap },
                    { label: "Integrity Risk", value: "Low", trend: "Stable", icon: ShieldAlert },
                ].map((stat) => (
                    <Card key={stat.label}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                <span className="text-green-500 font-medium">{stat.trend}</span> vs previous year
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Score Distribution</CardTitle>
                        <CardDescription>Frequency of marks across the cohort.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-end gap-2 pb-6 px-8">
                        {/* Simulated Bar Chart */}
                        {[2, 5, 12, 18, 25, 32, 28, 15, 8, 4].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-help">
                                <div
                                    className="w-full bg-primary/20 hover:bg-primary/40 rounded-t transition-all"
                                    style={{ height: `${h * 8}px` }}
                                />
                                <span className="text-[10px] text-muted-foreground">{i * 10}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Viva vs Code Correlation</CardTitle>
                        <CardDescription>Identifying disconnects in performance.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>High Consistency</span>
                                <span className="font-bold">78%</span>
                            </div>
                            <Progress value={78} className="h-2" />
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground italic border-l-2 pl-4">
                            "Most students show high correlation between their code quality and viva performance, indicating genuine understanding."
                        </div>
                        <div className="pt-4 border-t space-y-3">
                            <h4 className="text-xs font-bold uppercase">Outliers detected</h4>
                            <div className="flex items-center justify-between p-2 rounded bg-red-500/5 text-red-500 border border-red-500/10">
                                <span className="text-xs">High Code / Low Viva</span>
                                <Badge variant="destructive" className="h-4 text-[9px]">4 Students</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Test Failure Heatmap</CardTitle>
                        <CardDescription>Identifying common struggle points across questions.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="grid grid-cols-4 divide-x border-y">
                            {["Two Sum", "Palindrome", "Merge Arrays", "Tree Traversal"].map((q) => (
                                <div key={q} className="p-4 space-y-4">
                                    <h4 className="text-sm font-bold text-center">{q}</h4>
                                    <div className="space-y-2">
                                        {[
                                            { label: "Timeout", val: 12 },
                                            { label: "Logic Error", val: 45 },
                                            { label: "Memory", val: 8 },
                                        ].map((err) => (
                                            <div key={err.label} className="flex flex-col gap-1">
                                                <div className="flex justify-between text-[10px]">
                                                    <span>{err.label}</span>
                                                    <span>{err.val}%</span>
                                                </div>
                                                <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                                                    <div className="bg-orange-500 h-full" style={{ width: `${err.val}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
