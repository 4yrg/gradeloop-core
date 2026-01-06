"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Code } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AssignmentInfoPanelProps {
    assignmentQuestion: string;
    studentAnswer: string;
    isExpanded: boolean;
    onToggle: () => void;
}

export function AssignmentInfoPanel({
    assignmentQuestion,
    studentAnswer,
    isExpanded,
    onToggle
}: AssignmentInfoPanelProps) {
    const [activeTab, setActiveTab] = useState<'question' | 'answer'>('question');

    return (
        <div className="w-full">
            {/* Toggle Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="mb-2 text-xs text-muted-foreground hover:text-foreground"
            >
                {isExpanded ? (
                    <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Hide Assignment Info
                    </>
                ) : (
                    <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Show Assignment Info
                    </>
                )}
            </Button>

            {/* Collapsible Content */}
            {isExpanded && (
                <div className="bg-muted/30 border rounded-xl overflow-hidden animate-in slide-in-from-top-2 duration-300">
                    {/* Tabs */}
                    <div className="flex border-b bg-muted/50">
                        <button
                            onClick={() => setActiveTab('question')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'question'
                                    ? 'text-foreground border-b-2 border-primary bg-background'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <FileText className="h-3.5 w-3.5" />
                            Assignment Question
                        </button>
                        <button
                            onClick={() => setActiveTab('answer')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'answer'
                                    ? 'text-foreground border-b-2 border-primary bg-background'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Code className="h-3.5 w-3.5" />
                            Your Answer
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 max-h-48 overflow-y-auto">
                        {activeTab === 'question' ? (
                            <p className="text-sm leading-relaxed text-foreground/90">
                                {assignmentQuestion}
                            </p>
                        ) : (
                            <pre className="text-xs font-mono bg-zinc-950 text-zinc-300 p-3 rounded-lg overflow-x-auto">
                                <code>{studentAnswer}</code>
                            </pre>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
