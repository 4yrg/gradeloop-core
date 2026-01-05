'use client';

import {
    Binary,
    Diff,
    Share2,
    AlertTriangle,
    CheckCircle2,
    Eye,
    Maximize2,
    Search,
    ChevronRight
} from "lucide-react";
import { Button } from "../../../../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../../../../../components/ui/card";
import { Badge } from "../../../../../../../../components/ui/badge";
import { ScrollArea } from "../../../../../../../../components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "../../../../../../../../components/ui/select";

export default function ReviewSimilarityPage() {
    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Similarity Investigation</h2>
                    <p className="text-muted-foreground">Analyze clusters of highly similar submissions.</p>
                </div>
                <div className="flex gap-2">
                    <Select defaultValue="threshold-high">
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter clusters" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="threshold-high">High Similarity ({">"}90%)</SelectItem>
                            <SelectItem value="threshold-med">Medium Similarity ({">"}70%)</SelectItem>
                            <SelectItem value="all">All Clusters</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[700px]">
                {/* LHS: Cluster Visualizer */}
                <Card className="flex flex-col overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Similarity Clusters</CardTitle>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Maximize2 className="h-4 w-4" /></Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 bg-muted/20 relative p-0 overflow-hidden">
                        {/* Simulated Cluster Graph */}
                        <div className="absolute inset-0 flex items-center justify-center p-8">
                            <svg className="w-full h-full opacity-60">
                                <line x1="100" y1="100" x2="300" y2="150" stroke="currentColor" strokeWidth="2" strokeDasharray="4" />
                                <line x1="300" y1="150" x2="250" y2="300" stroke="currentColor" strokeWidth="2" />
                                <line x1="100" y1="100" x2="250" y2="300" stroke="currentColor" strokeWidth="2" strokeDasharray="4" />

                                <circle cx="100" cy="100" r="40" className="fill-red-500/20 stroke-red-500" />
                                <circle cx="300" cy="150" r="30" className="fill-red-500/20 stroke-red-500" />
                                <circle cx="250" cy="300" r="35" className="fill-red-500/20 stroke-red-500" />

                                <text x="100" y="105" textAnchor="middle" className="text-[10px] fill-red-500 font-bold">Cluster A</text>
                                <text x="300" y="155" textAnchor="middle" className="text-[10px] fill-red-500 font-bold">Cluster B</text>
                                <text x="250" y="305" textAnchor="middle" className="text-[10px] fill-red-500 font-bold">Cluster C</text>
                            </svg>
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                <Badge variant="destructive" className="flex items-center gap-2">
                                    <AlertTriangle className="h-3 w-3" /> 3 High-Risk Clusters
                                </Badge>
                                <p className="text-[10px] text-muted-foreground">Select a node to view members</p>
                            </div>
                        </div>

                        {/* Member List Overlay */}
                        <div className="absolute right-4 top-4 bottom-4 w-48 bg-background/95 backdrop-blur border rounded-lg shadow-xl overflow-hidden flex flex-col">
                            <div className="p-2 border-b text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50">
                                Cluster A Members
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="p-1 space-y-1">
                                    {[
                                        { name: "Charlie Brown", score: 92 },
                                        { name: "Lucy van Pelt", score: 88 },
                                        { name: "Linus van Pelt", score: 85 },
                                        { name: "Sally Brown", score: 82 },
                                    ].map((m) => (
                                        <div key={m.name} className="flex flex-col p-2 rounded hover:bg-muted cursor-pointer transition-colors">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-bold truncate">{m.name}</span>
                                                <span className="text-[10px] text-red-500">{m.score}%</span>
                                            </div>
                                            <div className="w-full bg-muted h-1 mt-1 rounded-full overflow-hidden">
                                                <div className="bg-red-500 h-full" style={{ width: `${m.score}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </CardContent>
                </Card>

                {/* RHS: Diff Viewer */}
                <Card className="flex flex-col overflow-hidden">
                    <CardHeader className="pb-2 border-b">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Diff Viewer</CardTitle>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="h-7 text-[10px]">Charlie vs Lucy</Button>
                                <Button variant="outline" size="sm" className="h-7 text-[10px]">Side-by-Side</Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                        <div className="flex-1 bg-zinc-950 font-mono text-[11px] overflow-auto p-4">
                            <div className="space-y-0.5 whitespace-pre">
                                <div className="text-zinc-500"> 12 | function solveProblem(input) {'{'}</div>
                                <div className="bg-red-500/10 text-red-400">- 13 |   const results = input.filter(x {'=>'} x {'>'} 0);</div>
                                <div className="bg-green-500/10 text-green-400">+ 13 |   const filtered = input.filter(val {'=>'} val {'>'} 0);</div>
                                <div className="text-zinc-500"> 14 |   return filtered.sort((a,b) {'=>'} a - b);</div>
                                <div className="bg-red-500/10 text-red-400">- 15 |   // Logic for sorting</div>
                                <div className="bg-green-500/10 text-green-400">+ 15 |   // Sorting logic here</div>
                                <div className="text-zinc-500"> 16 | {'}'}</div>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-muted/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Instructor Verdict</p>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="h-7 text-[10px] text-red-500 border-red-500/20 bg-red-500/5">Plagiarism</Button>
                                    <Button size="sm" variant="outline" className="h-7 text-[10px] text-green-500 border-green-500/20 bg-green-500/5">Allowed</Button>
                                    <Button size="sm" variant="outline" className="h-7 text-[10px]">Investigate</Button>
                                </div>
                            </div>
                            <ScrollArea className="h-20 border rounded p-2 bg-background">
                                <p className="text-xs text-muted-foreground italic">
                                    Notes: Variable renaming (val vs x) and comment changes detected, but structural logic is identical.
                                </p>
                            </ScrollArea>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
