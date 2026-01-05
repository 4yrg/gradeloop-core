'use client';

import {
    GitBranch,
    History,
    ExternalLink,
    Diff,
    GitCommit,
    Clock,
    Search
} from "lucide-react";
import { Button } from "../../../../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../../../../../components/ui/card";
import { Badge } from "../../../../../../../../components/ui/badge";
import { ScrollArea } from "../../../../../../../../components/ui/scroll-area";

export default function CodeLineagePage() {
    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Code Lineage</h2>
                    <p className="text-muted-foreground">Trace the evolution of code through submissions and external commits.</p>
                </div>
                <Button variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Connect GitHub Repo
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Timeline */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Submission History</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[600px]">
                            <div className="p-4 space-y-6">
                                {[
                                    { ver: "v3 (Final)", time: "2h ago", type: "Submission", desc: "Added edge case handling", marks: 85, active: true },
                                    { ver: "v2", time: "1d ago", type: "Submission", desc: "Fixed timeout issue", marks: 42 },
                                    { ver: "v1", time: "2d ago", type: "Submission", desc: "Initial logic implementation", marks: 30 },
                                    { ver: "commit: e219f", time: "3d ago", type: "External", desc: "Refactor: extracted helper function" },
                                    { ver: "commit: a8b42", time: "4d ago", type: "External", desc: "Initial boilerplate" },
                                ].map((step, i) => (
                                    <div key={i} className={`relative pl-8 pb-8 last:pb-0 border-l border-muted ${step.active ? 'border-primary/50' : ''}`}>
                                        <div className={`absolute left-[-9px] top-0 h-4 w-4 rounded-full border-4 border-background ${step.type === 'Submission' ? 'bg-primary' : 'bg-muted-foreground'}`} />
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-sm font-bold ${step.active ? 'text-primary' : ''}`}>{step.ver}</span>
                                                <Badge variant="outline" className="text-[9px] h-4">{step.type}</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{step.desc}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {step.time}
                                                </span>
                                                {step.marks && <span className="text-[10px] font-mono font-bold text-primary">{step.marks}/100</span>}
                                            </div>
                                            <Button variant="ghost" size="sm" className="h-6 text-[10px] mt-2 px-2">Compare to Current</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Diff View / Analysis */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="bg-muted/5 border-b">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-sm font-bold">Lineage Analysis</CardTitle>
                                    <CardDescription>Tracing code origins and significant changes.</CardDescription>
                                </div>
                                <Badge variant="secondary">Comparing: v2 → v3</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                            <div className="flex-1 bg-zinc-950 font-mono text-[11px] p-6 overflow-auto text-zinc-400">
                                <p className="text-zinc-500 mb-4 decoration-dotted underline"> Analysis: Logic for 'filter' has changed significantly. </p>
                                <div className="space-y-0.5 whitespace-pre">
                                    <div className="text-zinc-500"> 45 | function processData(arr) {'{'}</div>
                                    <div className="bg-red-500/10 text-red-400">- 46 |   return arr.map(x {'=>'} x * 2);</div>
                                    <div className="bg-green-500/10 text-green-400">+ 46 |   const filtered = arr.filter(x {'=>'} x % 2 === 0);</div>
                                    <div className="bg-green-500/10 text-green-400">+ 47 |   return filtered.map(x {'=>'} x * 2);</div>
                                    <div className="text-zinc-500"> 48 | {'}'}</div>
                                </div>
                            </div>
                            <div className="p-6 border-t bg-muted/10">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold uppercase text-muted-foreground">Original Source</p>
                                        <div className="flex items-center gap-2 p-3 rounded border bg-background">
                                            <GitCommit className="h-4 w-4 text-muted-foreground" />
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-bold truncate">github.com/.../repo/utils.js</p>
                                                <p className="text-[10px] text-muted-foreground italic">72% similarity match</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold uppercase text-muted-foreground">Evolution Signal</p>
                                        <div className="flex items-center gap-2 p-3 rounded border bg-background">
                                            <History className="h-4 w-4 text-green-500" />
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-bold truncate">Natural Growth</p>
                                                <p className="text-[10px] text-muted-foreground italic">Iterative changes over 3 days.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
