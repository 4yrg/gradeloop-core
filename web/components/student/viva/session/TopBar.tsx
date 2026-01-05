"use client";

import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import { LogOut, Timer } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "../../../ui/alert-dialog";

interface TopBarProps {
    timeLeft: number; // in seconds
    currentQuestionIndex: number;
    totalQuestions: number;
    onEndSession: () => void;
}

export function TopBar({ timeLeft, currentQuestionIndex, totalQuestions, onEndSession }: TopBarProps) {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const isLowTime = timeLeft < 60; // Less than 1 minute

    return (
        <header className="flex h-16 items-center justify-between border-b px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 font-mono text-lg font-bold ${isLowTime ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                    <Timer className="h-5 w-5" />
                    {formatTime(timeLeft)}
                </div>
                <Badge variant="outline" className="text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                </Badge>
            </div>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        End Session
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>End Viva Session?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to end the session early? This action cannot be undone and your current progress will be submitted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onEndSession} className="bg-destructive hover:bg-destructive/90">
                            End Session
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </header>
    );
}
