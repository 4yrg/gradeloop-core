"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { ScrollArea } from "../../../../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import {
    BookOpen,
    Code,
    FileText,
    Info,
    ShieldAlert,
    Table as TableIcon,
    Play,
    Clock
} from "lucide-react";
import Link from "next/link";
import { Assignment } from "../data/mock-assignments";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "../../../../components/ui/alert";
import { cn } from "../../../../lib/utils";

interface AssignmentDetailsDialogProps {
    assignment: Assignment;
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function AssignmentDetailsDialog({ assignment, children, open, onOpenChange }: AssignmentDetailsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 pb-4 bg-muted/30 border-b shrink-0">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-bold">{assignment.gradingMethod} Grading</Badge>
                            {assignment.difficulty && (
                                <Badge className={cn(
                                    "border-none text-[10px] font-extrabold uppercase",
                                    assignment.difficulty === 'Easy' ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                                        assignment.difficulty === 'Medium' ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                                            "bg-destructive/10 text-destructive"
                                )}>
                                    {assignment.difficulty}
                                </Badge>
                            )}
                        </div>
                        <DialogTitle className="text-3xl font-bold tracking-tight">{assignment.title}</DialogTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1.5 font-medium">
                                <Clock className="h-4 w-4 text-primary" />
                                Due: {new Date(assignment.dueDate).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <Tabs defaultValue="overview" className="h-full flex flex-col">
                        <div className="px-6 border-b shrink-0">
                            <TabsList className="bg-transparent h-12 p-0 gap-6">
                                <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent text-muted-foreground h-full border-b-2 border-transparent text-sm font-semibold px-0 transition-none">
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger value="specs" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent text-muted-foreground h-full border-b-2 border-transparent text-sm font-semibold px-0 transition-none">
                                    Specifications
                                </TabsTrigger>
                                <TabsTrigger value="rubric" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent text-muted-foreground h-full border-b-2 border-transparent text-sm font-semibold px-0 transition-none">
                                    Rubric
                                </TabsTrigger>
                                <TabsTrigger value="policy" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent text-muted-foreground h-full border-b-2 border-transparent text-sm font-semibold px-0 transition-none">
                                    Policies
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1 overflow-y-auto">
                            <div className="p-6">
                                <TabsContent value="overview" className="mt-0 space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            <BookOpen className="h-5 w-5 text-primary" />
                                            Problem Statement
                                        </h3>
                                        <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground">
                                            <p className="whitespace-pre-wrap leading-relaxed">
                                                {assignment.problemStatement}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                <ShieldAlert className="h-4 w-4" />
                                                Constraints
                                            </h3>
                                            <ul className="space-y-2">
                                                {assignment.constraints.map((c, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                                        {c}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="bg-primary/5 border-primary/20 rounded-xl p-4 space-y-4">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                <Info className="h-4 w-4" />
                                                Test Cases
                                            </h3>
                                            <p className="text-sm text-foreground/80">
                                                This assignment uses both <span className="font-bold">Visible</span> and <span className="font-bold">Hidden</span> test cases.
                                            </p>
                                            <div className="bg-background border rounded-lg p-3 text-xs flex gap-3">
                                                <div className="bg-amber-500/10 p-2 rounded-lg shrink-0">
                                                    <Info className="h-4 w-4 text-amber-500" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-bold uppercase tracking-tighter">Note on Hidden Cases</p>
                                                    <p className="text-muted-foreground">Hidden test cases are run only during official submission.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="specs" className="mt-0 space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-primary" />
                                            Input / Output Format
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-muted/50 rounded-lg font-mono text-sm border">
                                                <p className="font-bold text-primary mb-2">// Input Specification</p>
                                                <p className="text-foreground/80">Standard input should contain the sequence of commands as described in the problem statement...</p>
                                            </div>
                                            <div className="p-4 bg-muted/50 rounded-lg font-mono text-sm border">
                                                <p className="font-bold text-primary mb-2">// Output Specification</p>
                                                <p className="text-foreground/80">Standard output should return the result of each command, one per line...</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4">
                                            <h4 className="font-bold flex items-center gap-2 uppercase text-xs tracking-widest text-muted-foreground">
                                                <Code className="h-4 w-4" />
                                                Samples
                                            </h4>
                                            {assignment.sampleIO.map((sample, i) => (
                                                <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Sample Input {i + 1}</p>
                                                        <pre className="p-4 bg-muted/30 border rounded-xl text-xs font-mono">{sample.input}</pre>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Sample Output {i + 1}</p>
                                                        <pre className="p-4 bg-muted/30 border rounded-xl text-xs font-mono">{sample.output}</pre>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="rubric" className="mt-0">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            <TableIcon className="h-5 w-5 text-primary" />
                                            Scoring Rubric
                                        </h3>
                                        <div className="border rounded-xl bg-card overflow-hidden">
                                            <Table>
                                                <TableHeader className="bg-muted/30">
                                                    <TableRow>
                                                        <TableHead className="font-bold">Criterion</TableHead>
                                                        <TableHead className="text-right font-bold w-[120px]">Points</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {assignment.rubric.map((item, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell className="font-medium">{item.criterion}</TableCell>
                                                            <TableCell className="text-right font-bold">{item.points}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                    <TableRow className="bg-muted/10">
                                                        <TableCell className="font-extrabold uppercase text-xs tracking-wider">Total Available</TableCell>
                                                        <TableCell className="text-right font-black text-primary text-base">{assignment.totalScore}</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="policy" className="mt-0 space-y-6">
                                    <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 space-y-4">
                                        <h3 className="text-lg font-bold flex items-center gap-2 text-destructive">
                                            <ShieldAlert className="h-5 w-5" />
                                            Academic Integrity Policy
                                        </h3>
                                        <div className="space-y-4 text-sm text-foreground/80 leading-relaxed">
                                            <p>
                                                By starting this assignment, you agree to the university's academic integrity policy.
                                                Plagiarism is strictly prohibited and will be checked using automated tools.
                                            </p>
                                            <ul className="list-disc pl-5 space-y-2">
                                                <li>You must not share your code with anyone else.</li>
                                                <li>Using AI tools to generate complete solutions is prohibited unless explicitly allowed.</li>
                                                <li>All external libraries used must be documented.</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-muted/30 rounded-xl border">
                                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Late Policy</p>
                                        <p className="text-sm font-medium">{assignment.latePolicy}</p>
                                    </div>
                                </TabsContent>
                            </div>
                        </ScrollArea>
                    </Tabs>
                </div>

                <DialogFooter className="p-6 pt-2 bg-muted/10 border-t shrink-0 flex flex-row items-center justify-between sm:justify-between">
                    <div className="text-xs text-muted-foreground italic mr-auto">
                        Your work is auto-saved every 30 seconds.
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" size="lg" onClick={() => onOpenChange?.(false)}>Cancel</Button>
                        <Button size="lg" asChild className="shadow-lg shadow-primary/20">
                            <Link href={`/student/courses/${assignment.courseId}/assignments/${assignment.id}/workspace`}>
                                <Play className="h-4 w-4 mr-2" />
                                Open Workspace
                            </Link>
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
