'use client';

import {
    Flag,
    ShieldAlert,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Search,
    Filter,
    ArrowRight,
    User,
    Clock,
    Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function IntegrityFlagsPage() {
    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Integrity Flags</h2>
                    <p className="text-muted-foreground">Review and resolve academic integrity alerts.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">Download Report</Button>
                    <Button size="sm">Resolve Selected</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Stats */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Total Flags</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">12</div>
                        <p className="text-[10px] text-muted-foreground mt-1">4 Critical • 8 Medium</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">AI Likelihood</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">5</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Suspected LLM generation</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Similarity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">4</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Inter-batch matches</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Behavioral</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">3</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Abnormal dev patterns</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="border-b bg-muted/5 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle>Active Flags Queue</CardTitle>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input placeholder="Search students..." className="pl-8 h-8 w-[200px] text-xs" />
                            </div>
                            <Select defaultValue="all">
                                <SelectTrigger className="h-8 w-[120px] text-xs">
                                    <SelectValue placeholder="Resolution" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Unresolved</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                        <div className="divide-y">
                            {[
                                { student: "Charlie Brown", type: "AI Likelihood", risk: "Critical", score: "94%", detail: "Highly predictable token patterns consistent with GPT-4o.", time: "2h ago" },
                                { student: "Lucy van Pelt", type: "Similarity", risk: "Critical", score: "88%", detail: "Structural logic match with Linus van Pelt (88%).", time: "5h ago" },
                                { student: "Linus van Pelt", type: "Similarity", risk: "Critical", score: "88%", detail: "Structural logic match with Lucy van Pelt (88%).", time: "5h ago" },
                                { student: "Sally Brown", type: "Behavioral", risk: "Medium", score: "High", detail: "Significant code paste detected (400 LOC in 2s).", time: "1d ago" },
                                { student: "Peppermint Patty", type: "AI Likelihood", risk: "Medium", score: "62%", detail: "Inconsistent code style compared to previous attempts.", time: "2d ago" },
                            ].map((f, i) => (
                                <div key={i} className="p-4 flex items-start gap-4 transition-colors hover:bg-muted/30">
                                    <div className="mt-1">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${f.risk === 'Critical' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                            <ShieldAlert className="h-4 w-4" />
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold">{f.student}</span>
                                            <Badge variant="outline" className={`text-[10px] px-1 h-4 ${f.risk === 'Critical' ? 'border-red-500/20 text-red-500 bg-red-500/5' : ''}`}>
                                                {f.type} • {f.score}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground ml-auto">{f.time}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {f.detail}
                                        </p>
                                        <div className="flex gap-2 pt-2">
                                            <Button variant="outline" size="sm" className="h-7 text-[10px]">Compare Submissions</Button>
                                            <Button variant="outline" size="sm" className="h-7 text-[10px]">View IDE Playback</Button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Button size="sm" className="h-8 px-3 text-[11px] bg-red-600 hover:bg-red-700">Plagiarism</Button>
                                        <Button size="sm" variant="ghost" className="h-8 px-3 text-[11px]">Clear Flag</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
