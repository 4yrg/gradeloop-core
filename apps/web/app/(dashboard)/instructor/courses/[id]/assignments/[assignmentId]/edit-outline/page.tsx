'use client';

import { useState } from "react";
import {
    Plus,
    GripVertical,
    MoreVertical,
    Code2,
    TestTube2,
    Settings2,
    Save,
    Trash2,
    Copy,
    ChevronRight,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Question {
    id: string;
    title: string;
    marks: number;
    type: string;
    completed: boolean;
}

export default function EditOutlinePage() {
    const [questions, setQuestions] = useState<Question[]>([
        { id: "1", title: "Two Sum", marks: 10, type: "Coding", completed: true },
        { id: "2", title: "Valid Palindrome", marks: 15, type: "Coding", completed: false },
        { id: "3", title: "Merge Sorted Arrays", marks: 20, type: "Coding", completed: false },
    ]);

    const [selectedId, setSelectedId] = useState("1");
    const activeQuestion = questions.find(q => q.id === selectedId);

    return (
        <div className="flex h-[calc(100vh-10rem)] gap-0 border rounded-lg overflow-hidden bg-background">
            {/* LHS: Question List */}
            <div className="w-80 border-r flex flex-col bg-muted/5">
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="relative flex-1 mr-2">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search questions..." className="pl-8 h-9" />
                    </div>
                    <Button size="icon" variant="outline" className="h-9 w-9 shrink-0">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {questions.map((q) => (
                            <div
                                key={q.id}
                                onClick={() => setSelectedId(q.id)}
                                className={`group flex items-center gap-2 p-3 rounded-md cursor-pointer transition-colors ${selectedId === q.id
                                        ? "bg-primary/10 text-primary border-primary/20"
                                        : "hover:bg-muted"
                                    } border border-transparent`}
                            >
                                <GripVertical className="h-4 w-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-medium truncate">{q.title}</p>
                                        <Badge variant="outline" className="text-[10px] px-1 h-4">
                                            {q.marks}m
                                        </Badge>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        {q.type} • {q.completed ? "Configured" : "Pending"}
                                    </p>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem><Copy className="mr-2 h-4 w-4" /> Duplicate</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t bg-muted/20">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Marks:</span>
                        <span className="font-bold">45 / 100</span>
                    </div>
                </div>
            </div>

            {/* RHS: Question Config Panel */}
            <div className="flex-1 flex flex-col min-w-0">
                {activeQuestion ? (
                    <>
                        <div className="p-4 border-b flex items-center justify-between bg-card">
                            <div className="flex items-center gap-4">
                                <h3 className="font-bold text-lg">{activeQuestion.title}</h3>
                                <Badge variant="secondary">Coding Question</Badge>
                            </div>
                            <Button size="sm">
                                <Save className="mr-2 h-4 w-4" />
                                Save Question
                            </Button>
                        </div>
                        <Tabs defaultValue="definition" className="flex-1 flex flex-col">
                            <div className="px-4 border-b bg-muted/5">
                                <TabsList className="h-12 bg-transparent gap-6 p-0">
                                    <TabsTrigger value="definition" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none">
                                        <Code2 className="mr-2 h-4 w-4" /> Definition
                                    </TabsTrigger>
                                    <TabsTrigger value="testcases" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none">
                                        <TestTube2 className="mr-2 h-4 w-4" /> Test Cases
                                    </TabsTrigger>
                                    <TabsTrigger value="scoring" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none">
                                        <Settings2 className="mr-2 h-4 w-4" /> Scoring & Rules
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="p-6">
                                    <TabsContent value="definition" className="m-0 space-y-6">
                                        <div className="space-y-2">
                                            <Label>Problem Description (Markdown)</Label>
                                            <Textarea
                                                placeholder="Enter the problem description..."
                                                className="min-h-[300px] font-mono text-sm leading-relaxed"
                                                defaultValue={`Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.`}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label>Time Limit (ms)</Label>
                                                <Input type="number" defaultValue="1000" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Memory Limit (MB)</Label>
                                                <Input type="number" defaultValue="256" />
                                            </div>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="testcases" className="m-0 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-semibold">Test Case Suite</h4>
                                                <p className="text-xs text-muted-foreground">Define inputs and expected outputs for validation.</p>
                                            </div>
                                            <Button size="sm" variant="outline">
                                                <Plus className="mr-2 h-4 w-4" /> Add Test Case
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            {[1, 2, 3].map((i) => (
                                                <Card key={i}>
                                                    <CardContent className="p-4 flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs font-bold">{i}</div>
                                                            <div>
                                                                <p className="text-sm font-medium">Test Case #{i}</p>
                                                                <p className="text-xs text-muted-foreground">Public • 3 marks</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button variant="ghost" size="sm">Edit</Button>
                                                            <Button variant="ghost" size="sm" className="text-destructive">Delete</Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="scoring" className="m-0 space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-semibold">Grading Policy</h4>
                                            <div className="space-y-4">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="partial" defaultChecked />
                                                    <label htmlFor="partial" className="text-sm font-medium leading-none">Allow partial credit</label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="hidden" defaultChecked />
                                                    <label htmlFor="hidden" className="text-sm font-medium leading-none">Use hidden test cases for final grading</label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="retry" />
                                                    <label htmlFor="retry" className="text-sm font-medium leading-none">Enable retries with penalty</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Internal Marking Guide</Label>
                                            <Textarea placeholder="Notes for reviewers..." className="min-h-[100px]" />
                                        </div>
                                    </TabsContent>
                                </div>
                            </ScrollArea>
                        </Tabs>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <Code2 className="h-12 w-12 mb-4 opacity-20" />
                        <p>Select a question to edit its configuration</p>
                    </div>
                )}
            </div>
        </div>
    );
}
