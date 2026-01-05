
import { ScrollArea } from "../../../ui/scroll-area";
import { CheckCircle2, MessageSquare } from "lucide-react";
import { Separator } from "../../../ui/separator";

interface HistoryItem {
    question: string;
    answer: string;
    status: 'correct' | 'partial' | 'needs_improvement';
}

interface SessionSidebarProps {
    history: HistoryItem[];
}

export function SessionSidebar({ history }: SessionSidebarProps) {
    return (
        <div className="w-80 border-l bg-muted/10 flex flex-col h-full">
            <div className="p-4 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Session History
                </h3>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                    {history.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-10">
                            No questions answered yet.
                        </div>
                    ) : (
                        history.map((item, i) => (
                            <div key={i} className="space-y-2">
                                <p className="text-sm font-medium leading-none">{item.question}</p>
                                <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                    "{item.answer}"
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    <span className="text-[10px] uppercase font-bold text-green-600">Recorded</span>
                                </div>
                                <Separator className="my-4" />
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 border-t bg-background">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Concepts Covered</h4>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Tree Traversal
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                        Time Complexity
                    </div>
                </div>
            </div>
        </div>
    );
}
