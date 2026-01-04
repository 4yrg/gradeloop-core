"use client";

import { use, useState, useEffect } from "react";
import {
    Mic,
    Play,
    Settings,
    Video,
    VideoOff,
    HelpCircle,
    Circle,
    GraduationCap,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function VivaSessionPage({
    params
}: {
    params: Promise<{ courseId: string; assignmentId: string }>
}) {
    // Unused params for now, but kept for future use
    use(params);
    const [isActive, setIsActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [isActive, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-6xl mx-auto w-full px-4 pt-6">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-bold tracking-tight">Viva Session</h1>
                        <p className="text-muted-foreground">Live oral examination in progress.</p>
                    </div>
                    <Badge variant="outline" className="h-fit px-4 py-1 text-sm border-primary/20 bg-primary/5 text-primary">
                        <Circle className="h-2 w-2 fill-primary mr-2 animate-pulse" />
                        Live Session
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Video Interface Mock */}
                    <Card className="aspect-video bg-zinc-950 relative overflow-hidden flex items-center justify-center group border-2 border-primary/20">
                        {!isActive ? (
                            <div className="flex flex-col items-center gap-4 text-zinc-400">
                                <div className="h-20 w-20 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                    <VideoOff className="h-8 w-8" />
                                </div>
                                <p className="text-sm font-medium">Camera and Microphone are Off</p>
                                <Button onClick={() => setIsActive(true)} size="lg" className="rounded-full px-8">
                                    <Play className="mr-2 h-4 w-4" />
                                    Start Camera
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center">
                                            <Video className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-white font-bold">John Student</p>
                                            <p className="text-xs text-zinc-400 uppercase tracking-widest animate-pulse flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                                Recording
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {/* Instructor Overlay Mock */}
                                <div className="absolute top-6 right-6 w-48 aspect-video bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden shadow-2xl">
                                    <div className="h-full w-full flex items-center justify-center bg-zinc-800">
                                        <GraduationCap className="h-8 w-8 text-zinc-600" />
                                    </div>
                                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 rounded text-[10px] text-white">
                                        Prof. AI Instructor
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Controls */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
                            <Button variant="secondary" size="icon" className="rounded-full bg-zinc-900/80 border-zinc-700 text-white hover:bg-zinc-800">
                                <Mic className="h-5 w-5" />
                            </Button>
                            <Button variant="destructive" size="icon" className="rounded-full h-12 w-12" onClick={() => setIsActive(false)}>
                                <VideoOff className="h-6 w-6" />
                            </Button>
                            <Button variant="secondary" size="icon" className="rounded-full bg-zinc-900/80 border-zinc-700 text-white hover:bg-zinc-800">
                                <Settings className="h-5 w-5" />
                            </Button>
                        </div>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Current Question</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-lg bg-muted/50 border border-primary/10">
                                <p className="font-medium text-lg">"Explain the time complexity of searching in a Balanced Binary Search Tree."</p>
                            </div>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                    Speak clearly and concisely.
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                    You can ask for clarification if needed.
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Remaining Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-5xl font-black text-center tabular-nums text-primary mb-4 font-mono">
                                {formatTime(timeLeft)}
                            </div>
                            <Separator className="mb-4" />
                            <div className="space-y-4">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Session Started</span>
                                    <span className="font-bold font-mono">10:00 AM</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Status</span>
                                    <Badge variant="secondary" className="px-2 py-0 text-[10px]">Ongoing</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Alert variant="default" className="bg-muted/50 border-dashed">
                        <HelpCircle className="h-4 w-4" />
                        <AlertTitle className="text-sm font-bold uppercase tracking-wider text-[10px]">Trouble connecting?</AlertTitle>
                        <AlertDescription className="text-xs">
                            Check your network settings or contact support via the help button if technical issues persist.
                        </AlertDescription>
                    </Alert>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Session Checklist</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-4 w-4 rounded border border-primary flex items-center justify-center bg-primary/10">
                                    <CheckCircle2 className="h-3 w-3 text-primary" />
                                </div>
                                <span className="text-xs">Microphone Connected</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-4 w-4 rounded border border-primary flex items-center justify-center bg-primary/10">
                                    <CheckCircle2 className="h-3 w-3 text-primary" />
                                </div>
                                <span className="text-xs">Camera Connected</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
