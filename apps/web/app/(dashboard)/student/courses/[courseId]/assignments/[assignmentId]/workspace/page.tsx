"use client";

import { use, useState, useEffect } from "react";
import {
    BookOpen,
    Play,
    ArrowLeft,
    RotateCcw,
    Settings,
    ChevronUp,
    ChevronDown,
    LayoutPanelLeft,
    Monitor,
    Maximize2,
    Command,
    Terminal
} from "lucide-react";
import Link from "next/link";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { MOCK_ASSIGNMENTS } from "@/features/student/assignments/data/mock-assignments";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { SocraticChatbot } from "@/features/student/assignments/components/socratic-chatbot";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";

export default function WorkspacePage({
    params
}: {
    params: Promise<{ courseId: string; assignmentId: string }>
}) {
    const { courseId, assignmentId } = use(params);
    const assignment = MOCK_ASSIGNMENTS.find(a => a.id === assignmentId);

    const [code, setCode] = useState("// Start coding here...");
    const [language, setLanguage] = useState(assignment?.allowedLanguages[0]?.toLowerCase() || "python");
    const [output, setOutput] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isConsoleOpen, setIsConsoleOpen] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => {
            setLastSaved(new Date());
        }, 30000);
        return () => clearInterval(timer);
    }, []);

    if (!assignment) return <div className="flex items-center justify-center h-screen">Assignment not found</div>;

    const handleRun = () => {
        setIsRunning(true);
        setIsConsoleOpen(true);
        setOutput("Running test cases...\n");
        setTimeout(() => {
            setOutput(prev => prev + "Test Case 1: PASSED\nTest Case 2: PASSED\nTest Case 3: FAILED\n  Expected: 20\n  Actual: 10\n\nExecution finished.");
            setIsRunning(false);
        }, 1500);
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground selection:bg-primary/20">
            {/* Workspace Header */}
            <header className="h-[50px] border-b bg-card flex items-center justify-between px-4 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild className="h-8 gap-2 px-2 text-muted-foreground hover:text-foreground">
                        <Link href={`/student/courses/${courseId}/assignments`}>
                            <ArrowLeft className="h-4 w-4" />
                            <span className="font-bold">Back</span>
                        </Link>
                    </Button>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-2">
                        <LayoutPanelLeft className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold truncate max-w-[200px] sm:max-w-none">{assignment.title}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-muted rounded-md border text-muted-foreground">
                        <Command className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">Auto-Save</span>
                    </div>
                    <Separator orientation="vertical" className="h-4 mx-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Maximize2 className="h-4 w-4" />
                    </Button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal">
                    {/* Left Panel: Description */}
                    <ResizablePanel defaultSize={40} minSize={25} className="bg-card">
                        <Tabs defaultValue="description" className="h-full flex flex-col">
                            <div className="px-4 border-b flex items-center shrink-0">
                                <TabsList className="bg-transparent h-10 p-0 gap-4">
                                    <TabsTrigger
                                        value="description"
                                        className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent text-muted-foreground h-full border-b-2 border-transparent text-xs font-semibold px-0 transition-none"
                                    >
                                        Description
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="submissions"
                                        className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent text-muted-foreground h-full border-b-2 border-transparent text-xs font-semibold px-0 transition-none"
                                    >
                                        Submissions
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                            <TabsContent value="description" className="flex-1 m-0 overflow-hidden">
                                <ScrollArea className="h-full">
                                    <div className="p-6 pb-12 space-y-8">
                                        <div className="space-y-4">
                                            <h1 className="text-2xl font-bold tracking-tight">{assignment.title}</h1>
                                            <div className="flex gap-2">
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
                                                <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">Auto-Graded</Badge>
                                            </div>
                                        </div>

                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <p className="text-muted-foreground leading-relaxed">
                                                {assignment.problemStatement}
                                            </p>

                                            <div className="space-y-6 mt-8">
                                                {assignment.sampleIO.map((sample, i) => (
                                                    <div key={i} className="space-y-2">
                                                        <p className="text-xs font-black uppercase tracking-widest text-foreground">Example {i + 1}:</p>
                                                        <div className="bg-muted/50 border rounded-lg p-4 space-y-2 font-mono text-xs">
                                                            <div className="flex gap-2">
                                                                <span className="text-muted-foreground font-bold">Input:</span>
                                                                <code className="text-foreground">{sample.input}</code>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <span className="text-muted-foreground font-bold">Output:</span>
                                                                <code className="text-foreground">{sample.output}</code>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="space-y-3 mt-10">
                                                <p className="text-xs font-black uppercase tracking-widest text-foreground">Constraints:</p>
                                                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                                                    {assignment.constraints.map((c, i) => (
                                                        <li key={i} className="font-mono text-[11px]">{c}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </ResizablePanel>

                    <ResizableHandle withHandle className="bg-border/50 hover:bg-primary/50 transition-colors w-1.5" />

                    {/* Right Panel: Editor + Console */}
                    <ResizablePanel defaultSize={60} minSize={30}>
                        <ResizablePanelGroup direction="vertical">
                            {/* Editor Area */}
                            <ResizablePanel defaultSize={70} minSize={20} className="bg-background flex flex-col">
                                {/* Editor Header */}
                                <div className="h-10 border-b bg-muted/30 flex items-center justify-between px-4 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <Select value={language} onValueChange={setLanguage}>
                                            <SelectTrigger className="w-[120px] h-7 text-xs bg-background border-none shadow-none focus:ring-0 font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {assignment.allowedLanguages.map(lang => (
                                                    <SelectItem key={lang.toLowerCase()} value={lang.toLowerCase()}>{lang}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {lastSaved && (
                                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter ml-2">
                                                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => { if (confirm("Reset code?")) setCode("// Start coding here...") }} title="Reset Code">
                                            <RotateCcw className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Monaco Editor */}
                                <div className="flex-1 relative overflow-hidden">
                                    <Editor
                                        height="100%"
                                        theme="vs-dark" // Hardcoded dark for code clarity, but fits our theme
                                        language={language}
                                        value={code}
                                        onChange={(val) => setCode(val || "")}
                                        options={{
                                            fontSize: 14,
                                            fontFamily: "'Fira Code', monospace",
                                            minimap: { enabled: false },
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true,
                                            padding: { top: 16 },
                                            lineNumbers: "on",
                                            scrollbar: {
                                                vertical: "visible",
                                                verticalScrollbarSize: 8,
                                                horizontalScrollbarSize: 8
                                            }
                                        }}
                                    />
                                </div>

                                {/* Editor Footer */}
                                <div className="h-10 border-t bg-card/50 flex items-center justify-between px-4 shrink-0">
                                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                                        <span>Ln {code.split('\n').length}, Col {code.split('\n').at(-1)?.length || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs font-bold"
                                            onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                                        >
                                            Console
                                            {isConsoleOpen ? <ChevronDown className="ml-1 h-3 w-3" /> : <ChevronUp className="ml-1 h-3 w-3" />}
                                        </Button>
                                        <Separator orientation="vertical" className="h-4" />
                                        <Button
                                            size="sm"
                                            className="h-7 px-4 text-xs font-extrabold bg-muted hover:bg-muted-foreground/10 text-foreground border-none"
                                            onClick={handleRun}
                                            disabled={isRunning}
                                        >
                                            {isRunning ? "Running..." : "Run"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="h-7 px-4 text-xs font-black shadow-lg shadow-primary/20"
                                            asChild
                                        >
                                            <Link href={`/student/courses/${courseId}/assignments/${assignmentId}/submit`}>
                                                Submit
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </ResizablePanel>

                            {/* Console Panel */}
                            {isConsoleOpen && (
                                <>
                                    <ResizableHandle withHandle className="bg-border/50 h-1.5" />
                                    <ResizablePanel defaultSize={30} minSize={10} className="bg-card">
                                        <Tabs defaultValue="testcase" className="h-full flex flex-col">
                                            <div className="px-4 border-b shrink-0 h-10 flex items-center">
                                                <TabsList className="bg-transparent h-full p-0 gap-6">
                                                    <TabsTrigger
                                                        value="testcase"
                                                        className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent text-muted-foreground h-full border-b-2 border-transparent text-[10px] font-black uppercase tracking-widest px-0 transition-none"
                                                    >
                                                        Test Cases
                                                    </TabsTrigger>
                                                    <TabsTrigger
                                                        value="result"
                                                        className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent text-muted-foreground h-full border-b-2 border-transparent text-[10px] font-black uppercase tracking-widest px-0 transition-none"
                                                    >
                                                        Result
                                                    </TabsTrigger>
                                                </TabsList>
                                            </div>
                                            <TabsContent value="testcase" className="flex-1 m-0 overflow-hidden p-4">
                                                <ScrollArea className="h-full">
                                                    <div className="space-y-4 pb-4">
                                                        <div className="flex gap-2">
                                                            {[1, 2, 3].map(i => (
                                                                <Badge key={i} variant="outline" className="bg-muted/50 border-muted-foreground/20 text-muted-foreground cursor-pointer hover:bg-muted font-bold">Case {i}</Badge>
                                                            ))}
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-1.5">
                                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Input</p>
                                                                <div className="bg-muted/30 border rounded-md p-3 text-xs font-mono">
                                                                    [1, 2, 3, 4]
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Expected</p>
                                                                <div className="bg-muted/30 border rounded-md p-3 text-xs font-mono">
                                                                    [4, 3, 2, 1]
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </ScrollArea>
                                            </TabsContent>
                                            <TabsContent value="result" className="flex-1 m-0 overflow-hidden p-4 bg-muted/10 font-mono text-xs">
                                                <ScrollArea className="h-full">
                                                    {output ? (
                                                        <div className="space-y-2 pb-4">
                                                            <div className="flex items-center gap-2 text-primary font-bold">
                                                                <Terminal className="h-4 w-4" />
                                                                TERMINAL OUTPUT
                                                            </div>
                                                            <pre className="text-muted-foreground leading-relaxed">
                                                                {output}
                                                            </pre>
                                                        </div>
                                                    ) : (
                                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground italic gap-2 animate-pulse">
                                                            <span>Click "Run" to execute your code</span>
                                                        </div>
                                                    )}
                                                </ScrollArea>
                                            </TabsContent>
                                        </Tabs>
                                    </ResizablePanel>
                                </>
                            )}
                        </ResizablePanelGroup>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </main>

            {/* Socratic Chatbot */}
            <SocraticChatbot />
        </div>
    );
}
