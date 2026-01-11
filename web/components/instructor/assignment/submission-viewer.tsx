'use client';

import {
    Code2,
    Cpu,
    Mic,
    MessageSquare,
    ShieldAlert,
    GitBranch,
    FileCode,
    Search,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Info,
    Fingerprint
} from "lucide-react";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "../../ui/tabs";
import { ScrollArea } from "../../ui/scroll-area";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Progress } from "../../ui/progress";
import { Card, CardContent } from "../../ui/card";
import { KeystrokeAnalyticsTab } from "./keystroke-analytics-tab";

interface SubmissionViewerProps {
    submissionId: string;
    studentId?: string;
    assignmentId?: string;
}

export function SubmissionViewer({ submissionId, studentId, assignmentId }: SubmissionViewerProps) {
    return (
        <Tabs defaultValue="code" className="flex-1 flex flex-col h-full">
            <div className="px-4 border-b bg-muted/5">
                <TabsList className="h-12 bg-transparent gap-4 p-0">
                    <TabsTrigger value="code" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none">
                        <Code2 className="mr-2 h-4 w-4" /> Code
                    </TabsTrigger>
                    <TabsTrigger value="autograder" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none">
                        <Cpu className="mr-2 h-4 w-4" /> Autograder
                    </TabsTrigger>
                    <TabsTrigger value="viva" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none">
                        <Mic className="mr-2 h-4 w-4" /> Viva
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none">
                        <MessageSquare className="mr-2 h-4 w-4" /> Socratic Chat
                    </TabsTrigger>
                    <TabsTrigger value="integrity" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none">
                        <ShieldAlert className="mr-2 h-4 w-4" /> Integrity
                    </TabsTrigger>
                    <TabsTrigger value="auth" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none">
                        <Fingerprint className="mr-2 h-4 w-4" /> Auth Analytics
                    </TabsTrigger>
                    <TabsTrigger value="lineage" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none">
                        <GitBranch className="mr-2 h-4 w-4" /> Lineage
                    </TabsTrigger>
                </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
                <TabsContent value="code" className="m-0 h-full flex">
                    {/* File Tree Placeholder */}
                    <div className="w-56 border-r flex flex-col bg-muted/5">
                        <div className="p-3 text-[10px] font-bold uppercase text-muted-foreground border-b flex items-center justify-between">
                            Files
                            <Search className="h-3 w-3" />
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-2 space-y-0.5">
                                {["index.js", "utils.js", "api.js", "config.json"].map((f) => (
                                    <div key={f} className={`flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer ${f === 'index.js' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>
                                        <FileCode className="h-3.5 w-3.5" />
                                        <span>{f}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                    {/* Monaco Placeholder */}
                    <div className="flex-1 bg-zinc-950 text-zinc-300 font-mono text-sm p-6 overflow-auto">
                        <pre className="selection:bg-zinc-700">
                            {`function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`}
                        </pre>
                    </div>
                </TabsContent>

                <TabsContent value="autograder" className="m-0 h-full">
                    <ScrollArea className="h-full">
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-lg border bg-green-500/5 border-green-500/20">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                                    <div>
                                        <p className="font-bold">Execution Passed</p>
                                        <p className="text-xs text-muted-foreground">Ran 12 tests in 1.4s</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="border-green-500 text-green-500">72 / 100 Suggested</Badge>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold">Test Results</h4>
                                {[
                                    { name: "Public: Basic Cases", status: "Passed", marks: "10/10" },
                                    { name: "Public: Empty Input", status: "Passed", marks: "5/5" },
                                    { name: "Hidden: Large Dataset", status: "Failed", marks: "0/20", error: "Time Limit Exceeded (1.1s)" },
                                    { name: "Hidden: Edge Cases", status: "Passed", marks: "15/15" },
                                ].map((t, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                                        <div className="flex items-center gap-3">
                                            {t.status === "Passed" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{t.name}</span>
                                                {t.error && <span className="text-[10px] text-red-500 font-mono">{t.error}</span>}
                                            </div>
                                        </div>
                                        <span className="text-xs font-mono">{t.marks}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold">Execution Logs</h4>
                                <div className="p-4 rounded-lg bg-zinc-950 text-zinc-400 font-mono text-xs space-y-1">
                                    <p>[12:04:01] Initializing Node.js runner...</p>
                                    <p>[12:04:02] Transpiling source files...</p>
                                    <p className="text-zinc-100">[12:04:03] Running test suite...</p>
                                    <p>[12:04:04] Test 1: Passed</p>
                                    <p>[12:04:05] Test 2: Passed</p>
                                    <p className="text-red-400">[12:04:06] Test 3: TIMEOUT ( {'>'} 1.0s)</p>
                                    <p>[12:04:07] Suite finished.</p>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="viva" className="m-0 h-full">
                    <ScrollArea className="h-full">
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-8 p-4 rounded-lg border">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Submission Quality</p>
                                    <p className="text-lg font-bold text-green-500">High Confidence</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Viva Performance</p>
                                    <p className="text-lg font-bold text-yellow-500">Developing</p>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase font-bold">AI Verdict</p>
                                    <p className="text-sm">Student understands logic but struggles with complexity analysis.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold">Transcript Highlights</h4>
                                {[
                                    { q: "Can you explain why you used a Map here?", a: "To store the index of the complement so I can find it in O(1) time.", status: "correct" },
                                    { q: "What is the time complexity of this solution?", a: "I think it's O(n squared)... wait, no, it's O(n).", status: "partial" },
                                    { q: "What happens if there are duplicate numbers?", a: "The map will just overwrite the index, but the problem says exactly one solution.", status: "correct" },
                                ].map((t, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex gap-3">
                                            <Badge variant="outline" className="h-5">Q</Badge>
                                            <p className="text-sm font-medium">{t.q}</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <Badge className={`h-5 ${t.status === 'correct' ? 'bg-green-500' : 'bg-yellow-500'}`}>A</Badge>
                                            <div className="flex-1">
                                                <p className="text-sm text-muted-foreground italic">"{t.a}"</p>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-[10px] text-muted-foreground">Confidence: 94%</span>
                                                    <span className="text-[10px] text-muted-foreground">• Accuracy: {t.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="integrity" className="m-0 h-full">
                    <ScrollArea className="h-full">
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <Card>
                                    <CardContent className="p-4 pt-6 flex flex-col items-center text-center gap-2">
                                        <Badge variant="outline" className="text-red-500 border-red-500/20 bg-red-500/5">AI Likelihood</Badge>
                                        <span className="text-3xl font-bold">12%</span>
                                        <p className="text-xs text-muted-foreground">High human-written signal detected.</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 pt-6 flex flex-col items-center text-center gap-2">
                                        <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5">Clone Similarity</Badge>
                                        <span className="text-3xl font-bold">4%</span>
                                        <p className="text-xs text-muted-foreground">No significant matches in local database.</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 flex gap-3">
                                <Info className="h-5 w-5 text-blue-500 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold">External Match Detected</p>
                                    <p className="text-xs text-muted-foreground">Structural similarity (32%) found with a public GitHub repo (LeetCode solutions).</p>
                                    <Button variant="outline" size="sm" className="h-7 text-[10px] mt-2">Compare with External Source</Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold">Integrity Signals</h4>
                                {[
                                    { label: "Abnormal Paste", status: "Clean", detail: "Code entered via key-presses." },
                                    { label: "IP Conflict", status: "Flagged", detail: "Accessed from 2 different locations in 1 hour." },
                                    { label: "Library Usage", status: "Clean", detail: "Standard libraries used correctly." },
                                ].map((s, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 rounded-md border">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{s.label}</span>
                                            <span className="text-[10px] text-muted-foreground">{s.detail}</span>
                                        </div>
                                        <Badge variant={s.status === 'Clean' ? 'outline' : 'destructive'} className="text-[10px]">
                                            {s.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="auth" className="m-0 h-full">
                    {studentId && assignmentId ? (
                        <KeystrokeAnalyticsTab studentId={studentId} assignmentId={assignmentId} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <Fingerprint className="h-12 w-12 mb-4 opacity-20" />
                            <p>Student and assignment information required</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="lineage" className="m-0 h-full flex flex-col items-center justify-center text-muted-foreground">
                    <GitBranch className="h-12 w-12 mb-4 opacity-20" />
                    <p>Evolution timeline under construction</p>
                </TabsContent>
            </div>
        </Tabs>
    );
}
