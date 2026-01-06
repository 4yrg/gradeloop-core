"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, MessageSquare, AlertCircle, HelpCircle, Loader2, PanelRightClose } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ConversationTurn, FinalAssessment, AssessResponseResponse } from "@/types/ivas";
import { useMemo } from "react";

// Q&A pair derived from conversation history
interface QAPair {
    turnId: string;
    question: string;
    response: string;
    assessment?: AssessResponseResponse;
}

interface SessionSidebarProps {
    history: ConversationTurn[];
    assessment?: FinalAssessment | null;
    isProcessing?: boolean;
    onCollapse?: () => void;
}

export function SessionSidebar({ history, assessment, isProcessing = false, onCollapse }: SessionSidebarProps) {
    // Convert conversation history into Q&A pairs
    const qaPairs = useMemo<QAPair[]>(() => {
        const pairs: QAPair[] = [];
        let currentQuestion: string | null = null;

        for (const turn of history) {
            if (turn.speaker === 'AI') {
                currentQuestion = turn.text;
            } else if (turn.speaker === 'STUDENT' && currentQuestion) {
                pairs.push({
                    turnId: `qa-${pairs.length}`,
                    question: currentQuestion,
                    response: turn.text,
                    // Assessment would be attached here if available
                });
                currentQuestion = null;
            }
        }

        return pairs;
    }, [history]);

    // Extract concepts from assessment if available
    const conceptsCovered = assessment?.strengths || [];

    // Get status icon based on assessment
    const getStatusIcon = (pair: QAPair) => {
        if (!pair.assessment) {
            return <CheckCircle2 className="h-3 w-3 text-green-500" />;
        }

        const score = pair.assessment.confidenceScore || 0;
        if (score >= 0.8) {
            return <CheckCircle2 className="h-3 w-3 text-green-500" />;
        } else if (score >= 0.5) {
            return <AlertCircle className="h-3 w-3 text-yellow-500" />;
        }
        return <AlertCircle className="h-3 w-3 text-red-500" />;
    };

    const getStatusText = (pair: QAPair) => {
        if (!pair.assessment) return { text: "Recorded", color: "text-green-600" };

        const level = pair.assessment.understandingLevel;
        if (level === 'excellent' || level === 'good') return { text: "Strong", color: "text-green-600" };
        if (level === 'partial') return { text: "Partial", color: "text-yellow-600" };
        return { text: "Needs Work", color: "text-red-600" };
    };

    return (
        <div className="w-80 border-l bg-muted/10 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
                <div>
                    <h3 className="font-semibold flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Session History
                        {isProcessing && (
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        )}
                    </h3>
                    {qaPairs.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {qaPairs.length} question{qaPairs.length !== 1 ? 's' : ''} answered
                        </p>
                    )}
                </div>
                {onCollapse && (
                    <Button variant="ghost" size="icon" onClick={onCollapse} className="h-8 w-8">
                        <PanelRightClose className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-6 p-4">
                    {qaPairs.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-10">
                            {isProcessing ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Preparing first question...</span>
                                </div>
                            ) : (
                                "No questions answered yet."
                            )}
                        </div>
                    ) : (
                        qaPairs.map((pair, i) => {
                            const status = getStatusText(pair);
                            return (
                                <div key={pair.turnId} className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-medium leading-tight flex-1">
                                            {pair.question}
                                        </p>
                                        <Badge variant="outline" className="text-[10px] shrink-0">
                                            Q{i + 1}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                        "{pair.response}"
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            {getStatusIcon(pair)}
                                            <span className={`text-[10px] uppercase font-bold ${status.color}`}>
                                                {status.text}
                                            </span>
                                        </div>
                                        {pair.assessment?.confidenceScore !== undefined && (
                                            <span className="text-[10px] text-muted-foreground">
                                                Score: {Math.round(pair.assessment.confidenceScore * 100)}%
                                            </span>
                                        )}
                                    </div>
                                    {pair.assessment?.areasForImprovement?.[0] && (
                                        <p className="text-[10px] text-muted-foreground italic">
                                            {pair.assessment.areasForImprovement[0]}
                                        </p>
                                    )}
                                    <Separator className="my-4" />
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 border-t bg-background">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                    {assessment ? "Strengths" : "Concepts"}
                </h4>
                <div className="space-y-2">
                    {conceptsCovered.length > 0 ? (
                        conceptsCovered.slice(0, 4).map((concept, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                {concept}
                            </div>
                        ))
                    ) : (
                        <div className="text-xs text-muted-foreground">
                            Strengths will appear after assessment
                        </div>
                    )}
                </div>

                {assessment && (
                    <div className="mt-4 pt-3 border-t">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Overall Score</span>
                            <span className="font-bold text-primary">
                                {assessment.overallScore}%
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                            <span>Competency</span>
                            <Badge variant="secondary" className="text-[10px]">
                                {assessment.competencyLevel}
                            </Badge>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
