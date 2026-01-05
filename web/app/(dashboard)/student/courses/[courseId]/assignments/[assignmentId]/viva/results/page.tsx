"use client";

import { use } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Download,
    Share2,
    RotateCcw,
    BookOpen,
    MessageSquare,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Clock,
    User,
    ChevronDown,
    ChevronUp,
    Search
} from "lucide-react";
import { Button } from "../../../../../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../../components/ui/card";
import { Badge } from "../../../../../../../../../components/ui/badge";
import { Separator } from "../../../../../../../../../components/ui/separator";
import { Progress } from "../../../../../../../../../components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../../../../../../../components/ui/collapsible";
import { Input } from "../../../../../../../../../components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { useState } from "react";

// Mock data for the results
const mockResults = {
    overallScore: 85,
    grade: "B+",
    competencyLevel: "Intermediate",
    passFail: "Pass",
    assessmentDate: "2026-01-04T14:30:00Z",
    conceptMastery: [
        { concept: "AVL Tree Rotations", score: 95, mastery: 90 },
        { concept: "Time Complexity Analysis", score: 80, mastery: 75 },
        { concept: "Communication Clarity", score: 85, mastery: 80 },
        { concept: "Algorithm Correctness", score: 90, mastery: 85 },
        { concept: "Problem Solving", score: 75, mastery: 70 }
    ],
    strengths: [
        "Strong understanding of AVL tree rotations",
        "Clear explanation of algorithm steps",
        "Good grasp of time complexity concepts"
    ],
    weaknesses: [
        "Could improve on edge case handling",
        "More practice needed in advanced scenarios"
    ],
    misconceptions: [
        {
            misconception: "Confusing O(log n) with O(n log n)",
            explanation: "You mentioned O(n log n) for search operations, but AVL trees maintain O(log n) due to balanced height.",
            resource: "Review Big O notation for tree operations"
        }
    ],
    transcript: [
        { timestamp: "00:15", speaker: "AI", message: "Let's start with AVL tree rotations. Can you explain a single right rotation?" },
        { timestamp: "00:32", speaker: "Student", message: "A single right rotation occurs when the left subtree is too tall. You rotate the subtree to the right, making the left child the new root." },
        { timestamp: "00:45", speaker: "AI", message: "Good! Now, what's the time complexity of this operation?" },
        { timestamp: "01:02", speaker: "Student", message: "It's O(n log n) because you have to traverse the tree." },
        { timestamp: "01:15", speaker: "AI", message: "Actually, it's O(log n) since the height is logarithmic. Let's clarify this concept." }
    ],
    instructorFeedback: "Overall good performance. You have solid foundational knowledge but need to be more precise with complexity analysis. Consider reviewing the relationship between tree height and operations."
};

function getScoreColor(score: number) {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-yellow-600";
    if (score >= 70) return "text-orange-600";
    return "text-red-600";
}

function getMasteryColor(mastery: number) {
    if (mastery >= 80) return "bg-green-500";
    if (mastery >= 60) return "bg-yellow-500";
    if (mastery >= 40) return "bg-orange-500";
    return "bg-red-500";
}

function ResultsHeader({ results }: { results: typeof mockResults }) {
    const isPass = results.passFail === "Pass";
    return (
        <Card className={`border-2 ${isPass ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
            <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className={`h-16 w-16 rounded-full ${isPass ? 'bg-green-500/20' : 'bg-red-500/20'} flex items-center justify-center`}>
                            {isPass ? <CheckCircle2 className="h-8 w-8 text-green-600" /> : <XCircle className="h-8 w-8 text-red-600" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{results.competencyLevel} Level</h2>
                            <p className={`text-sm ${isPass ? 'text-green-600' : 'text-red-600'}`}>{results.passFail} - {results.grade}</p>
                            <p className="text-sm text-muted-foreground">
                                Assessed on {new Date(results.assessmentDate).toLocaleDateString()} at {new Date(results.assessmentDate).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Overall Score</p>
                        <div className="text-5xl font-black text-foreground">{results.overallScore}<span className="text-2xl text-muted-foreground font-medium">/100</span></div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function ConceptMasteryChart({ data }: { data: typeof mockResults.conceptMastery }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Concept Mastery Overview
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="concept" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="mastery" fill="#3b82f6" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

function ConceptMasteryGrid({ data }: { data: typeof mockResults.conceptMastery }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Detailed Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {data.map((item, index) => (
                    <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="font-medium">{item.concept}</span>
                            <div className="flex items-center gap-2">
                                <span className={`font-bold ${getScoreColor(item.score)}`}>{item.score}/100</span>
                                <Badge variant="outline">{item.mastery}% mastery</Badge>
                            </div>
                        </div>
                        <Progress value={item.mastery} className="h-2" />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function StrengthsWeaknessesList({ strengths, weaknesses }: { strengths: string[], weaknesses: string[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                        <TrendingUp className="h-5 w-5" />
                        Strengths
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {strengths.map((strength, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{strength}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-700">
                        <TrendingDown className="h-5 w-5" />
                        Areas for Improvement
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {weaknesses.map((weakness, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{weakness}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}

function MisconceptionsCard({ misconceptions }: { misconceptions: typeof mockResults.misconceptions }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    Misconceptions Identified
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {misconceptions.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                        <h4 className="font-semibold text-red-700">{item.misconception}</h4>
                        <p className="text-sm text-muted-foreground">{item.explanation}</p>
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-blue-600">{item.resource}</span>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function TranscriptViewer({ transcript }: { transcript: typeof mockResults.transcript }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredTranscript = transcript.filter(item =>
        item.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Conversation Transcript
                            </div>
                            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </CardTitle>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search transcript..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {filteredTranscript.map((item, index) => (
                                <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                        <span className="text-xs text-muted-foreground font-mono">{item.timestamp}</span>
                                    </div>
                                    <div className="flex items-start gap-2 flex-1">
                                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${item.speaker === 'AI' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                            {item.speaker === 'AI' ? 'AI' : 'S'}
                                        </div>
                                        <p className="text-sm leading-relaxed">{item.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}

function FeedbackSection({ feedback }: { feedback: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Instructor Feedback
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm leading-relaxed italic">"{feedback}"</p>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <div className="h-8 w-8 rounded-full bg-zinc-200" />
                    <div>
                        <p className="text-sm font-bold">Prof. Jane Doe</p>
                        <p className="text-xs text-muted-foreground">Evaluator</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function ActionButtons({ courseId, assignmentId }: { courseId: string; assignmentId: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-3">
                    <Button asChild>
                        <Link href={`/student/courses/${courseId}/assignments/${assignmentId}/viva`}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Retake Viva
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={`/student/courses/${courseId}/assignments/${assignmentId}`}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Review Assignment
                        </Link>
                    </Button>
                    <Button variant="outline">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Request Human Review
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function VivaResultsPage({
    params
}: {
    params: Promise<{ courseId: string; assignmentId: string }>
}) {
    const { courseId, assignmentId } = use(params);

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-6xl mx-auto w-full px-4 pt-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Button variant="ghost" asChild className="w-fit -ml-2 text-muted-foreground hover:text-foreground">
                    <Link href={`/student/courses/${courseId}/assignments/${assignmentId}/viva`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Viva Overview
                    </Link>
                </Button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Assessment Results</h1>
                        <p className="text-muted-foreground">Detailed breakdown of your viva performance</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Report
                        </Button>
                        <Button variant="outline" size="sm">
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                        </Button>
                    </div>
                </div>
            </div>

            {/* Results Header */}
            <ResultsHeader results={mockResults} />

            {/* Concept Mastery Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ConceptMasteryChart data={mockResults.conceptMastery} />
                <ConceptMasteryGrid data={mockResults.conceptMastery} />
            </div>

            {/* Strengths and Weaknesses */}
            <StrengthsWeaknessesList strengths={mockResults.strengths} weaknesses={mockResults.weaknesses} />

            {/* Misconceptions */}
            {mockResults.misconceptions.length > 0 && (
                <MisconceptionsCard misconceptions={mockResults.misconceptions} />
            )}

            {/* Conversation Transcript */}
            <TranscriptViewer transcript={mockResults.transcript} />

            {/* Instructor Feedback */}
            {mockResults.instructorFeedback && (
                <FeedbackSection feedback={mockResults.instructorFeedback} />
            )}

            {/* Action Items */}
            <ActionButtons courseId={courseId} assignmentId={assignmentId} />
        </div>
    );
}
