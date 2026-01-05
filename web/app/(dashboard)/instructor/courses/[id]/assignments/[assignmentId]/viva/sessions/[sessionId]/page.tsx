"use client";

import { use } from "react";
import Link from "next/link";
import { useState } from "react";
import {
    ArrowLeft,
    Play,
    Pause,
    Search,
    Clock,
    User,
    Target,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    XCircle,
    MessageSquare,
    Code,
    FileText,
    Edit,
    Save,
    Flag,
    RotateCcw,
    ChevronDown,
    ChevronRight,
    Eye,
    EyeOff,
    Volume2,
    VolumeX,
    SkipBack,
    SkipForward
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

// Mock data for the session review
const mockSessionData = {
    sessionId: '1',
    student: {
        id: '101',
        name: 'Alice Johnson',
        email: 'alice.johnson@university.edu',
        avatar: null,
        previousAttempts: [
            { date: '2025-12-15', score: 78, status: 'passed' },
            { date: '2025-11-20', score: 65, status: 'failed' }
        ]
    },
    assessment: {
        overallScore: 92,
        competencyLevel: 'Advanced',
        irtAbility: 1.8,
        passFail: 'Pass',
        duration: 14,
        startedAt: '2026-01-04T10:30:00Z',
        completedAt: '2026-01-04T10:44:00Z'
    },
    conceptMastery: [
        { concept: 'AVL Tree Rotations', score: 95, mastery: 90, expected: 85 },
        { concept: 'Time Complexity Analysis', score: 88, mastery: 85, expected: 80 },
        { concept: 'Communication Clarity', score: 90, mastery: 88, expected: 75 },
        { concept: 'Algorithm Correctness', score: 92, mastery: 90, expected: 85 },
        { concept: 'Problem Solving', score: 85, mastery: 80, expected: 70 }
    ],
    analysis: {
        strengths: [
            'Excellent understanding of AVL tree operations',
            'Clear communication of complex concepts',
            'Strong problem-solving approach'
        ],
        weaknesses: [
            'Minor hesitation on edge cases',
            'Could elaborate more on time complexity proofs'
        ],
        misconceptions: [
            {
                misconception: 'Confusing O(log n) with O(n log n)',
                detected: true,
                corrected: true,
                severity: 'low'
            }
        ],
        confidenceLevels: [
            { question: 1, confidence: 95 },
            { question: 2, confidence: 88 },
            { question: 3, confidence: 92 }
        ]
    },
    transcript: [
        {
            timestamp: '00:15',
            speaker: 'AI',
            message: 'Let\'s start with AVL tree rotations. Can you explain how a single right rotation works?',
            type: 'question'
        },
        {
            timestamp: '00:32',
            speaker: 'Student',
            message: 'A single right rotation occurs when the left subtree is too tall. You rotate the subtree to the right, making the left child the new root. This maintains the AVL balance property.',
            type: 'answer',
            analysis: {
                understanding: 95,
                conceptsCovered: ['AVL Trees', 'Rotations', 'Balance Property'],
                expectedConcepts: ['AVL Trees', 'Rotations', 'Balance Property'],
                missedConcepts: [],
                confidence: 95
            }
        },
        {
            timestamp: '00:45',
            speaker: 'AI',
            message: 'Good! Now, what is the time complexity of this operation?',
            type: 'question'
        },
        {
            timestamp: '01:02',
            speaker: 'Student',
            message: 'The time complexity is O(log n) because you\'re only traversing the height of the tree, not all nodes.',
            type: 'answer',
            analysis: {
                understanding: 88,
                conceptsCovered: ['Time Complexity', 'Big O'],
                expectedConcepts: ['Time Complexity', 'Big O', 'Tree Height'],
                missedConcepts: ['Tree Height'],
                confidence: 88
            }
        },
        {
            timestamp: '01:15',
            speaker: 'AI',
            message: 'Excellent explanation. Let\'s move to the next concept...',
            type: 'feedback'
        }
    ],
    questions: [
        {
            id: 1,
            text: 'Explain how a single right rotation works in an AVL tree.',
            difficulty: 'intermediate',
            expectedConcepts: ['AVL Trees', 'Rotations', 'Balance Property'],
            studentResponse: 'A single right rotation occurs when the left subtree is too tall. You rotate the subtree to the right, making the left child the new root. This maintains the AVL balance property.',
            analysis: {
                understanding: 95,
                conceptsCovered: ['AVL Trees', 'Rotations', 'Balance Property'],
                missedConcepts: [],
                score: 10
            }
        },
        {
            id: 2,
            text: 'What is the time complexity of an AVL tree rotation operation?',
            difficulty: 'intermediate',
            expectedConcepts: ['Time Complexity', 'Big O', 'Tree Height'],
            studentResponse: 'The time complexity is O(log n) because you\'re only traversing the height of the tree, not all nodes.',
            analysis: {
                understanding: 88,
                conceptsCovered: ['Time Complexity', 'Big O'],
                missedConcepts: ['Tree Height'],
                score: 8
            }
        },
        {
            id: 3,
            text: 'How would you implement a function to check if a binary tree is height-balanced?',
            difficulty: 'advanced',
            expectedConcepts: ['Height Balance', 'Recursive Algorithms', 'Tree Traversal'],
            studentResponse: 'You can write a recursive function that returns the height of each subtree and checks if the difference is at most 1. If any subtree violates this, the tree is not balanced.',
            analysis: {
                understanding: 92,
                conceptsCovered: ['Height Balance', 'Recursive Algorithms', 'Tree Traversal'],
                missedConcepts: [],
                score: 9
            }
        }
    ],
    codeSnippet: `class AVLTree:
    def rotate_right(self, node):
        left_child = node.left
        node.left = left_child.right
        left_child.right = node
        # Update heights...
        return left_child

    def get_height(self, node):
        return node.height if node else 0

    def get_balance(self, node):
        return self.get_height(node.left) - self.get_height(node.right)`
};

function TranscriptViewer({ transcript, searchTerm }: { transcript: typeof mockSessionData.transcript, searchTerm: string }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    const filteredTranscript = transcript.filter(item =>
        item.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Conversation Transcript
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            <SkipBack className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setIsPlaying(!isPlaying)}>
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="sm">
                            <SkipForward className="h-4 w-4" />
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto space-y-3 p-6">
                    {filteredTranscript.map((item, index) => (
                        <div key={index} className={`flex gap-3 p-3 rounded-lg ${
                            item.speaker === 'AI' ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-green-50 border-l-4 border-green-500'
                        }`}>
                            <div className="flex items-center gap-2 min-w-0">
                                <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <span className="text-xs text-muted-foreground font-mono">{item.timestamp}</span>
                            </div>
                            <div className="flex items-start gap-2 flex-1">
                                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                    item.speaker === 'AI' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                }`}>
                                    {item.speaker === 'AI' ? 'AI' : 'S'}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm leading-relaxed">{item.message}</p>
                                    {item.analysis && (
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            <div className="flex gap-4">
                                                <span>Understanding: {item.analysis.understanding}%</span>
                                                <span>Confidence: {item.analysis.confidence}%</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function CodeViewer({ code }: { code: string }) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Code Under Discussion
                </CardTitle>
            </CardHeader>
            <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{code}</code>
                </pre>
            </CardContent>
        </Card>
    );
}

function AssessmentSummary({ assessment }: { assessment: typeof mockSessionData.assessment }) {
    const isPass = assessment.passFail === 'Pass';

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="text-center space-y-4">
                    <div className={`h-20 w-20 rounded-full mx-auto flex items-center justify-center ${
                        isPass ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                        {isPass ? (
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        ) : (
                            <XCircle className="h-10 w-10 text-red-600" />
                        )}
                    </div>
                    <div>
                        <div className="text-4xl font-bold">{assessment.overallScore}/100</div>
                        <Badge variant={isPass ? "default" : "destructive"} className="mt-2">
                            {assessment.passFail}
                        </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Competency Level:</span>
                            <Badge variant="outline">{assessment.competencyLevel}</Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">IRT Ability (θ):</span>
                            <span className="font-mono">{assessment.irtAbility}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Duration:</span>
                            <span>{assessment.duration} minutes</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function ConceptMasteryChart({ data }: { data: typeof mockSessionData.conceptMastery }) {
    const radarData = data.map(item => ({
        concept: item.concept.length > 15 ? item.concept.substring(0, 15) + '...' : item.concept,
        mastery: item.mastery,
        expected: item.expected
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Concept Mastery
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="concept" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                        <Radar name="Mastery" dataKey="mastery" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                        <Radar name="Expected" dataKey="expected" stroke="#ef4444" fill="transparent" />
                    </RadarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                    {data.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                            <span className="font-medium">{item.concept}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">{item.score}/100</span>
                                <Badge variant="outline">{item.mastery}% mastery</Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function AnalysisInsights({ analysis }: { analysis: typeof mockSessionData.analysis }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Analysis Insights
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Strengths
                    </Label>
                    <ul className="space-y-1 text-sm">
                        {analysis.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <div className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                                {strength}
                            </li>
                        ))}
                    </ul>
                </div>

                <Separator />

                <div>
                    <Label className="text-sm font-medium text-orange-700 mb-2 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        Areas for Improvement
                    </Label>
                    <ul className="space-y-1 text-sm">
                        {analysis.weaknesses.map((weakness, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <div className="w-1 h-1 bg-orange-600 rounded-full mt-2 flex-shrink-0" />
                                {weakness}
                            </li>
                        ))}
                    </ul>
                </div>

                {analysis.misconceptions.length > 0 && (
                    <>
                        <Separator />
                        <div>
                            <Label className="text-sm font-medium text-red-700 mb-2 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Misconceptions Detected
                            </Label>
                            <div className="space-y-2">
                                {analysis.misconceptions.map((item, index) => (
                                    <div key={index} className="p-2 bg-red-50 rounded text-sm">
                                        <div className="font-medium">{item.misconception}</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Status: {item.corrected ? 'Corrected' : 'Not addressed'} • Severity: {item.severity}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function InstructorActions({ sessionId }: { sessionId: string }) {
    const [overrideScore, setOverrideScore] = useState<number | null>(null);
    const [feedback, setFeedback] = useState('');
    const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Instructor Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                    </Button>
                    <Button variant="outline" size="sm">
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                    </Button>
                </div>

                <Dialog open={isOverrideModalOpen} onOpenChange={setIsOverrideModalOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                            <Edit className="h-4 w-4 mr-2" />
                            Override Score
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Override Assessment Score</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Override Score (0-100)</Label>
                                <Input
                                    type="number"
                                    value={overrideScore || ''}
                                    onChange={(e) => setOverrideScore(parseInt(e.target.value))}
                                    min="0"
                                    max="100"
                                />
                            </div>
                            <div>
                                <Label>Justification</Label>
                                <Textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Explain the reason for score override..."
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={() => setIsOverrideModalOpen(false)}>Save Override</Button>
                                <Button variant="outline" onClick={() => setIsOverrideModalOpen(false)}>Cancel</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <Button variant="outline" className="w-full">
                    <Flag className="h-4 w-4 mr-2" />
                    Flag for Review
                </Button>

                <Button variant="outline" className="w-full">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Grant Retake
                </Button>

                <div>
                    <Label className="text-sm">Additional Feedback</Label>
                    <Textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Add manual feedback for the student..."
                        rows={3}
                        className="mt-1"
                    />
                    <Button className="w-full mt-2" size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Save Feedback
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function QuestionBreakdown({ questions }: { questions: typeof mockSessionData.questions }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Question-by-Question Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {questions.map((question) => (
                        <Collapsible key={question.id}>
                            <CollapsibleTrigger asChild>
                                <Button variant="outline" className="w-full justify-between p-4 h-auto">
                                    <div className="text-left">
                                        <div className="font-medium">{question.text}</div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            Difficulty: {question.difficulty} • Score: {question.analysis.score}/10
                                        </div>
                                    </div>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-4 pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium">Student Response</Label>
                                        <div className="mt-1 p-3 bg-muted rounded text-sm">
                                            {question.studentResponse}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <Label className="text-sm font-medium">Understanding Level</Label>
                                            <div className="mt-1">
                                                <Progress value={question.analysis.understanding} className="h-2" />
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {question.analysis.understanding}% understanding
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium">Concepts Covered</Label>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {question.analysis.conceptsCovered.map((concept, i) => (
                                                    <Badge key={i} variant="default" className="text-xs">
                                                        {concept}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        {question.analysis.missedConcepts.length > 0 && (
                                            <div>
                                                <Label className="text-sm font-medium text-orange-700">Missed Concepts</Label>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {question.analysis.missedConcepts.map((concept, i) => (
                                                        <Badge key={i} variant="destructive" className="text-xs">
                                                            {concept}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <Label className="text-sm font-medium">Expected Concepts</Label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {question.expectedConcepts.map((concept, i) => (
                                            <Badge key={i} variant="outline" className="text-xs">
                                                {concept}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default function SessionReviewPage({
    params
}: {
    params: Promise<{ id: string; assignmentId: string; sessionId: string }>
}) {
    const { id: courseId, assignmentId, sessionId } = use(params);
    const [transcriptSearch, setTranscriptSearch] = useState('');

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-7xl mx-auto w-full px-4 pt-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Button variant="ghost" asChild className="w-fit -ml-2 text-muted-foreground hover:text-foreground">
                    <Link href={`/instructor/courses/${courseId}/assignments/${assignmentId}/viva/sessions`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Sessions
                    </Link>
                </Button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Session Review</h1>
                        <p className="text-muted-foreground mt-1">
                            Detailed analysis of {mockSessionData.student.name}'s viva session
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <FileText className="mr-2 h-4 w-4" />
                            Export Report
                        </Button>
                        <Button>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content - Two Panel Layout */}
            <ResizablePanelGroup direction="horizontal" className="min-h-[600px]">
                {/* Left Panel - Transcript and Code */}
                <ResizablePanel defaultSize={60} minSize={40}>
                    <div className="space-y-6 pr-4">
                        {/* Transcript Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search transcript..."
                                value={transcriptSearch}
                                onChange={(e) => setTranscriptSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Transcript Viewer */}
                        <TranscriptViewer transcript={mockSessionData.transcript} searchTerm={transcriptSearch} />

                        {/* Code Viewer */}
                        <CodeViewer code={mockSessionData.codeSnippet} />
                    </div>
                </ResizablePanel>

                <ResizableHandle />

                {/* Right Panel - Analysis and Actions */}
                <ResizablePanel defaultSize={40} minSize={30}>
                    <div className="space-y-6 pl-4">
                        {/* Student Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Student Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3 mb-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarFallback>
                                            {mockSessionData.student.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{mockSessionData.student.name}</p>
                                        <p className="text-sm text-muted-foreground">{mockSessionData.student.id}</p>
                                    </div>
                                </div>
                                {mockSessionData.student.previousAttempts.length > 0 && (
                                    <div>
                                        <Label className="text-sm">Previous Attempts</Label>
                                        <div className="space-y-1 mt-1">
                                            {mockSessionData.student.previousAttempts.map((attempt, index) => (
                                                <div key={index} className="flex justify-between text-xs">
                                                    <span>{new Date(attempt.date).toLocaleDateString()}</span>
                                                    <Badge variant={attempt.status === 'passed' ? 'default' : 'destructive'} className="text-xs">
                                                        {attempt.score}/100
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Assessment Summary */}
                        <AssessmentSummary assessment={mockSessionData.assessment} />

                        {/* Concept Mastery Chart */}
                        <ConceptMasteryChart data={mockSessionData.conceptMastery} />

                        {/* Analysis Insights */}
                        <AnalysisInsights analysis={mockSessionData.analysis} />

                        {/* Instructor Actions */}
                        <InstructorActions sessionId={sessionId} />
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>

            {/* Bottom Section - Question Breakdown */}
            <QuestionBreakdown questions={mockSessionData.questions} />
        </div>
    );
}