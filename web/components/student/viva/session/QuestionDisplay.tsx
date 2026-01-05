import { Badge } from "../../../ui/badge";
import { Card, CardContent } from "../../../ui/card";
import { Lightbulb } from "lucide-react";

interface QuestionDisplayProps {
    question: string;
    codeSnippet?: string;
    concepts: string[];
}

export function QuestionDisplay({ question, codeSnippet, concepts }: QuestionDisplayProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    {concepts.map((concept, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                            {concept}
                        </Badge>
                    ))}
                </div>
                <h2 className="text-3xl font-bold leading-tight tracking-tight text-foreground">
                    {question}
                </h2>
            </div>

            {codeSnippet && (
                <Card className="bg-muted/50 border-primary/20 overflow-hidden">
                    <CardContent className="p-0">
                        <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/80 text-xs text-muted-foreground">
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
                            </div>
                            <span className="font-mono ml-2">snippet.ts</span>
                        </div>
                        <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
                            <code>{codeSnippet}</code>
                        </pre>
                    </CardContent>
                </Card>
            )}

            <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-500 bg-yellow-500/10 w-fit px-3 py-1.5 rounded-full">
                <Lightbulb className="h-4 w-4" />
                <span>Try to explain your thought process step-by-step.</span>
            </div>
        </div>
    );
}
