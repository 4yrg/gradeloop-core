'use client';

import { useState } from "react";
import {
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    AlertCircle,
    CheckCircle2,
    Clock,
    User,
    MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { SubmissionViewer } from "@/components/instructor/assignment/submission-viewer";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface Submission {
    id: string;
    studentName: string;
    studentId: string;
    attempt: number;
    timestamp: string;
    score: number;
    status: 'Graded' | 'Ungraded' | 'Flagged';
    integrityScore: number;
}

export default function ManageSubmissionsPage() {
    const [submissions] = useState<Submission[]>([
        { id: "S1", studentName: "Alice Johnson", studentId: "CS21001", attempt: 2, timestamp: "2h ago", score: 85, status: "Graded", integrityScore: 98 },
        { id: "S2", studentName: "Bob Smith", studentId: "CS21005", attempt: 1, timestamp: "5h ago", score: 0, status: "Ungraded", integrityScore: 92 },
        { id: "S3", studentName: "Charlie Brown", studentId: "CS21012", attempt: 3, timestamp: "1d ago", score: 45, status: "Flagged", integrityScore: 45 },
        { id: "S4", studentName: "Diana Prince", studentId: "CS21015", attempt: 1, timestamp: "2d ago", score: 92, status: "Graded", integrityScore: 95 },
    ]);

    const [selectedId, setSelectedId] = useState("S1");
    const activeSubmission = submissions.find(s => s.id === selectedId);

    return (
        <div className="flex h-[calc(100vh-10rem)] gap-0 border rounded-lg overflow-hidden bg-background -m-2">
            {/* LHS: Submission List */}
            <div className="w-80 border-r flex flex-col bg-muted/5">
                <div className="p-4 border-b space-y-3">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search students..." className="pl-8 h-9" />
                    </div>
                    <div className="flex gap-2">
                        <Select defaultValue="all">
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="ungraded">Ungraded</SelectItem>
                                <SelectItem value="flagged">Flagged</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                            <Filter className="h-3.3 w-3.5" />
                        </Button>
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {submissions.map((s) => (
                            <div
                                key={s.id}
                                onClick={() => setSelectedId(s.id)}
                                className={`group flex flex-col gap-1 p-3 rounded-md cursor-pointer transition-colors ${selectedId === s.id
                                        ? "bg-primary/10 text-primary border-primary/20"
                                        : "hover:bg-muted"
                                    } border border-transparent`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold truncate">{s.studentName}</span>
                                    <span className="text-[10px] text-muted-foreground">{s.timestamp}</span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <div className="flex gap-1">
                                        <Badge
                                            variant="outline"
                                            className={`text-[9px] px-1 h-4 ${s.status === 'Flagged' ? 'border-red-500 text-red-500 bg-red-500/5' :
                                                    s.status === 'Graded' ? 'border-green-500 text-green-500 bg-green-500/5' : ''
                                                }`}
                                        >
                                            {s.status}
                                        </Badge>
                                        <Badge variant="secondary" className="text-[9px] px-1 h-4">Att {s.attempt}</Badge>
                                    </div>
                                    <span className="text-xs font-mono">{s.score}/100</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="border-t p-2 bg-muted/20 flex items-center justify-between">
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronsLeft className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
                    </div>
                    <span className="text-[10px] font-medium">1-4 of 120</span>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronsRight className="h-4 w-4" /></Button>
                    </div>
                </div>
            </div>

            {/* Center: Submission Viewer */}
            <div className="flex-1 min-w-0 flex flex-col bg-card">
                {activeSubmission ? (
                    <SubmissionViewer submissionId={activeSubmission.id} />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <User className="h-12 w-12 mb-4 opacity-20" />
                        <p>Select a submission to grade</p>
                    </div>
                )}
            </div>

            {/* RHS: Grading Panel */}
            <div className="w-80 border-l flex flex-col bg-muted/5">
                <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-bold">Grading Panel</h3>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-6">
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Final Score</Label>
                            <div className="flex items-center gap-3">
                                <Input type="number" defaultValue={activeSubmission?.score} className="text-xl font-bold h-12" />
                                <span className="text-xl text-muted-foreground">/ 100</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground italic">
                                Autograder suggested: 72/100
                            </p>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Rubric Checklist</Label>
                            {[
                                { label: "Code Quality", marks: 10 },
                                { label: "Logic Correctness", marks: 40 },
                                { label: "Efficiency", marks: 20 },
                                { label: "Documentation", marks: 10 },
                            ].map((item) => (
                                <div key={item.label} className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-sm">{item.label}</span>
                                        <span className="text-xs font-mono">{item.marks}m</span>
                                    </div>
                                    <Input type="number" placeholder="Enter marks" className="h-8 text-sm" />
                                </div>
                            ))}
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Feedback to Student</Label>
                            <Textarea placeholder="Great work on the logic, but consider..." className="min-h-[120px] text-sm" />
                        </div>

                        <div className="space-y-3 pb-6">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Internal Notes</Label>
                            <Textarea placeholder="Suspicious similarity with CS21012..." className="min-h-[80px] text-sm bg-yellow-500/5 border-yellow-500/20" />
                        </div>
                    </div>
                </ScrollArea>
                <div className="p-4 border-t bg-card space-y-2">
                    <Button className="w-full" size="sm">Publish Grade</Button>
                    <Button variant="outline" className="w-full" size="sm">Save Draft</Button>
                </div>
            </div>
        </div>
    );
}
