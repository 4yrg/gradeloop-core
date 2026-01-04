'use client';

import {
    Mic,
    Save,
    Plus,
    BrainCircuit,
    Wand2,
    Eye,
    Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function VivaVocePage() {
    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Viva Voce Configuration</h2>
                    <p className="text-muted-foreground">Configure the AI-driven oral assessment agent.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Eye className="mr-2 h-4 w-4" />
                        Preview Agent
                    </Button>
                    <Button>
                        <Save className="mr-2 h-4 w-4" />
                        Save Configuration
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BrainCircuit className="h-5 w-5" />
                                Assessment Scope
                            </CardTitle>
                            <CardDescription>How the agent should select students and questions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Mandatory Viva for All</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Every student must complete a viva session to get marks.
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="space-y-4 pt-4 border-t">
                                <Label>Question Sampling Strategy</Label>
                                <Select defaultValue="code-context">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select strategy" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="code-context">Focus on submitted code context</SelectItem>
                                        <SelectItem value="comprehensive">Wide coverage of all topics</SelectItem>
                                        <SelectItem value="edge-cases">Focus on edge cases and logic</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <Label>Session Duration (Minutes)</Label>
                                    <span className="text-xs font-bold">10 min</span>
                                </div>
                                <Slider defaultValue={[10]} max={30} step={1} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings2 className="h-5 w-5" />
                                    Difficulty Ramping
                                </CardTitle>
                                <CardDescription>How the agent adjusts difficulty based on performance.</CardDescription>
                            </div>
                            <Badge variant="outline" className="text-blue-500 border-blue-500/20 bg-blue-500/5">Dynamic AI</Badge>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Adaptive Complexity</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Increase question difficulty when student answers correctly.
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Max Difficulty Floor</Label>
                                    <span className="text-xs text-muted-foreground">Level 4 (Intermediate)</span>
                                </div>
                                <Slider defaultValue={[4]} max={10} step={1} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                Question Pool
                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </CardTitle>
                            <CardDescription>Custom questions to seed the agent's knowledge.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
                            <ScrollArea className="flex-1 px-6">
                                <div className="space-y-4 pb-6">
                                    {[
                                        "Explain why you chose a Hash Map for lookup.",
                                        "What is the time complexity of your sorting logic?",
                                        "How would you handle NULL inputs in this function?",
                                        "Can this be implemented more efficiently?",
                                    ].map((q, i) => (
                                        <div key={i} className="group p-3 rounded-lg border bg-muted/30 relative">
                                            <p className="text-sm italic">"{q}"</p>
                                            <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100">
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                            <div className="p-4 border-t bg-muted/10">
                                <Button variant="outline" className="w-full text-xs" size="sm">
                                    <Wand2 className="mr-2 h-3 w-3" />
                                    Generate via AI
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
