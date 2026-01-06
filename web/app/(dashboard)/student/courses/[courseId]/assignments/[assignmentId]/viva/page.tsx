"use client";

import { use, useState, useRef, useEffect } from "react";
import {
    ArrowLeft,
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    CheckCircle2,
    AlertCircle,
    Loader2,
    PlayCircle,
    StopCircle,
    Clock,
    MessageSquare,
    Settings,
    LogOut,
    Radio,
    CircleDot,
    Sparkles,
    TrendingUp,
    TrendingDown,
    Target,
    Award,
    BookOpen,
    Code2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Types
interface VivaQuestion {
    question_number: number;
    question_text: string;
}

interface ConversationEntry {
    question_number: number;
    question_text: string;
    answer_text: string;
    understanding_level: string;
    score: number;
}

interface FinalReport {
    session_id: string;
    student_id: string;
    assignment_title: string;
    total_score: number;
    competency_level: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    conversation_history: ConversationEntry[];
}

type VivaState = 'not_started' | 'starting' | 'listening' | 'processing' | 'playing_question' | 'completed';

const IVAS_API_URL = 'http://localhost:8085';

// Mock assignment data
const MOCK_ASSIGNMENT = {
    id: 'asgn-1',
    title: 'Data Structures: Balanced Binary Search Trees',
    description: 'Implement an AVL tree with insert, delete, search, and level-order traversal operations.',
    problemStatement: 'Create a self-balancing AVL tree that maintains O(log n) time complexity for all operations.',
    studentCode: `class AVLNode:
    def __init__(self, key):
        self.key = key
        self.left = None
        self.right = None
        self.height = 1

class AVLTree:
    def __init__(self):
        self.root = None
    
    def height(self, node):
        if not node:
            return 0
        return node.height
    
    def balance(self, node):
        if not node:
            return 0
        return self.height(node.left) - self.height(node.right)
    
    def insert(self, root, key):
        if not root:
            return AVLNode(key)
        elif key < root.key:
            root.left = self.insert(root.left, key)
        else:
            root.right = self.insert(root.right, key)
        
        root.height = 1 + max(self.height(root.left), self.height(root.right))
        balance = self.balance(root)
        
        # Left Left Case
        if balance > 1 and key < root.left.key:
            return self.right_rotate(root)
        # Right Right Case
        if balance < -1 and key > root.right.key:
            return self.left_rotate(root)
        
        return root`,
};

// Audio Waveform Component
function AudioWaveform({ isActive, level }: { isActive: boolean; level: number }) {
    const bars = 12;
    return (
        <div className="flex items-center justify-center gap-1 h-24">
            {Array.from({ length: bars }).map((_, i) => {
                const baseHeight = isActive ? 20 + Math.random() * (level * 0.8) : 8;
                const animationDelay = `${i * 0.05}s`;
                return (
                    <div
                        key={i}
                        className={cn(
                            "w-1.5 rounded-full transition-all duration-100",
                            isActive ? "bg-white/80" : "bg-white/30"
                        )}
                        style={{
                            height: `${baseHeight}px`,
                            animationDelay,
                        }}
                    />
                );
            })}
        </div>
    );
}

// Timer Component
function SessionTimer({ startTime }: { startTime: Date | null }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!startTime) return;
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    return (
        <div className="flex items-center gap-2 font-mono text-lg">
            <Clock className="h-4 w-4" />
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
    );
}

export default function VivaPage({
    params
}: {
    params: Promise<{ courseId: string; assignmentId: string }>
}) {
    const { courseId, assignmentId } = use(params);

    // State
    const [vivaState, setVivaState] = useState<VivaState>('not_started');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<VivaQuestion | null>(null);
    const [questionNumber, setQuestionNumber] = useState(0);
    const [liveTranscript, setLiveTranscript] = useState<string>('');
    const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
    const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

    // Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number | null>(null);
    const historyEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll history
    useEffect(() => {
        historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversationHistory]);

    // Start the viva session
    const startViva = async () => {
        setVivaState('starting');
        setConnectionStatus('connecting');
        setError(null);

        try {
            const response = await fetch(`${IVAS_API_URL}/viva/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: 'student-123',
                    assignment_title: MOCK_ASSIGNMENT.title,
                    assignment_description: MOCK_ASSIGNMENT.description,
                    student_code: MOCK_ASSIGNMENT.studentCode,
                }),
            });

            if (!response.ok) throw new Error('Failed to start viva session');

            const data = await response.json();
            setSessionId(data.session_id);
            setCurrentQuestion(data.question);
            setQuestionNumber(1);
            setSessionStartTime(new Date());
            setConnectionStatus('connected');

            if (data.question_audio) {
                await playAudioFromHex(data.question_audio);
            }

            setVivaState('listening');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start viva');
            setVivaState('not_started');
            setConnectionStatus('disconnected');
        }
    };

    const endSession = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        setVivaState('not_started');
        setConnectionStatus('disconnected');
        setSessionStartTime(null);
    };

    // Play audio from hex string
    const playAudioFromHex = async (hexString: string) => {
        setVivaState('playing_question');
        try {
            const bytes = new Uint8Array(hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
            const blob = new Blob([bytes], { type: 'audio/mp3' });
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);

            await new Promise<void>((resolve, reject) => {
                audio.onended = () => resolve();
                audio.onerror = () => reject(new Error('Failed to play audio'));
                audio.play();
            });

            URL.revokeObjectURL(audioUrl);
        } catch (err) {
            console.error('Error playing audio:', err);
        }
        setVivaState('listening');
    };

    // Start recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 256;

            const visualize = () => {
                if (!analyserRef.current) return;
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setAudioLevel(average / 255 * 100);
                animationRef.current = requestAnimationFrame(visualize);
            };
            visualize();

            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setLiveTranscript('Listening...');
        } catch (err) {
            setError('Failed to access microphone. Please grant permission.');
        }
    };

    // Stop recording and submit
    const stopRecording = async () => {
        if (!mediaRecorderRef.current || !sessionId) return;

        setIsRecording(false);
        setVivaState('processing');
        setLiveTranscript('Processing your answer...');

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        setAudioLevel(0);

        return new Promise<void>((resolve) => {
            mediaRecorderRef.current!.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                mediaRecorderRef.current!.stream.getTracks().forEach(track => track.stop());
                await submitAnswer(audioBlob);
                resolve();
            };
            mediaRecorderRef.current!.stop();
        });
    };

    // Submit answer to backend
    const submitAnswer = async (audioBlob: Blob) => {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'answer.webm');

            const response = await fetch(
                `${IVAS_API_URL}/viva/answer?session_id=${sessionId}&question_number=${questionNumber}`,
                { method: 'POST', body: formData }
            );

            if (!response.ok) throw new Error('Failed to submit answer');

            const data = await response.json();
            setLiveTranscript(data.transcript || '');

            if (data.assessment) {
                const entry: ConversationEntry = {
                    question_number: questionNumber,
                    question_text: currentQuestion?.question_text || '',
                    answer_text: data.transcript,
                    understanding_level: data.assessment.understanding_level,
                    score: data.assessment.score,
                };
                setConversationHistory(prev => [...prev, entry]);
            }

            if (data.is_complete) {
                setFinalReport(data.final_report);
                setVivaState('completed');
            } else {
                setCurrentQuestion(data.next_question);
                setQuestionNumber(data.next_question.question_number);

                if (data.question_audio) {
                    await playAudioFromHex(data.question_audio);
                }
                setVivaState('listening');
                setLiveTranscript('');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit answer');
            setVivaState('listening');
        }
    };

    const getLevelColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'excellent': return 'bg-green-500/10 text-green-600 border-green-500/20';
            case 'good': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case 'partial': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
            case 'minimal': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
            case 'none': return 'bg-red-500/10 text-red-600 border-red-500/20';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    const getCompetencyColor = (level: string) => {
        switch (level) {
            case 'EXPERT': return 'bg-gradient-to-r from-green-500 to-emerald-500';
            case 'ADVANCED': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
            case 'INTERMEDIATE': return 'bg-gradient-to-r from-yellow-500 to-orange-500';
            case 'BEGINNER': return 'bg-gradient-to-r from-red-500 to-pink-500';
            default: return 'bg-muted';
        }
    };

    // ==================== NOT STARTED STATE ====================
    if (vivaState === 'not_started') {
        return (
            <div className="flex flex-col gap-8 pb-20 max-w-5xl mx-auto w-full px-4">
                <div className="flex flex-col gap-4">
                    <Button variant="ghost" asChild className="w-fit -ml-2">
                        <Link href={`/student/courses/${courseId}/assignments/${assignmentId}/submit`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Submission
                        </Link>
                    </Button>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Viva Assessment</h1>
                        <p className="text-muted-foreground">
                            AI-powered oral examination for <span className="font-medium text-foreground">{MOCK_ASSIGNMENT.title}</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Assignment Info */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BookOpen className="h-4 w-4 text-primary" />
                                Assignment Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">{MOCK_ASSIGNMENT.description}</p>
                            <Separator />
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Your Submitted Code</p>
                                <ScrollArea className="h-[200px] w-full rounded-lg border bg-zinc-950 p-4">
                                    <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap">
                                        {MOCK_ASSIGNMENT.studentCode}
                                    </pre>
                                </ScrollArea>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Start Card */}
                    <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Ready to Begin?</CardTitle>
                            <CardDescription>Complete the oral examination</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">1</div>
                                    <span>Listen to AI questions</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">2</div>
                                    <span>Speak your answers</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">3</div>
                                    <span>Answer 5 questions</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">4</div>
                                    <span>Get detailed feedback</span>
                                </div>
                            </div>

                            <Separator />

                            <div className="text-xs text-muted-foreground space-y-1">
                                <p>• Working microphone required</p>
                                <p>• Quiet environment recommended</p>
                                <p>• ~10-15 minutes duration</p>
                            </div>

                            {error && (
                                <Alert variant="destructive" className="py-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-xs">{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button className="w-full h-12 font-bold" onClick={startViva}>
                                <PlayCircle className="mr-2 h-5 w-5" />
                                Start Viva
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // ==================== STARTING STATE ====================
    if (vivaState === 'starting') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                    <div className="relative w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold">Connecting to IVAS</h2>
                    <p className="text-sm text-muted-foreground">Initializing AI examiner...</p>
                </div>
            </div>
        );
    }

    // ==================== COMPLETED STATE ====================
    if (vivaState === 'completed' && finalReport) {
        return (
            <div className="flex flex-col gap-8 pb-20 max-w-5xl mx-auto w-full px-4">
                <div className="flex flex-col items-center gap-4 text-center py-8">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-green-500/20 animate-pulse" />
                        <div className="relative bg-green-500/10 p-5 rounded-full">
                            <Award className="h-12 w-12 text-green-500" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold">Viva Completed!</h1>
                        <p className="text-muted-foreground text-sm">Here&apos;s your assessment report</p>
                    </div>
                </div>

                {/* Score Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <Card className="text-center py-6">
                        <div className="text-4xl font-bold">{finalReport.total_score}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Score</div>
                    </Card>
                    <Card className="text-center py-6">
                        <Badge className={cn("text-sm px-3 py-1 text-white", getCompetencyColor(finalReport.competency_level))}>
                            {finalReport.competency_level}
                        </Badge>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-2">Level</div>
                    </Card>
                    <Card className="text-center py-6">
                        <div className="text-4xl font-bold">{finalReport.conversation_history.length}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Questions</div>
                    </Card>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-green-500/20 bg-green-500/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                                <TrendingUp className="h-4 w-4" />
                                Strengths
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm">
                                {finalReport.strengths.map((s, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                                        <span>{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="border-orange-500/20 bg-orange-500/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
                                <TrendingDown className="h-4 w-4" />
                                Areas to Improve
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm">
                                {finalReport.weaknesses.map((w, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 mt-0.5 text-orange-500 shrink-0" />
                                        <span>{w}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* Conversation History */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Session Transcript
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                            <div className="space-y-4 pr-4">
                                {finalReport.conversation_history.map((entry, i) => (
                                    <div key={i} className="space-y-2 pb-4 border-b last:border-0">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="text-xs">Q{entry.question_number}</Badge>
                                            <Badge className={cn("text-xs", getLevelColor(entry.understanding_level))}>
                                                {entry.understanding_level} • {entry.score}/100
                                            </Badge>
                                        </div>
                                        <div className="bg-muted/50 rounded-lg p-3 text-sm">
                                            <p className="font-medium text-xs text-muted-foreground mb-1">Question:</p>
                                            <p>{entry.question_text}</p>
                                        </div>
                                        <div className="bg-primary/5 rounded-lg p-3 text-sm">
                                            <p className="font-medium text-xs text-muted-foreground mb-1">Your Answer:</p>
                                            <p>{entry.answer_text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <div className="flex gap-3">
                    <Button asChild variant="outline" className="flex-1">
                        <Link href={`/student/courses/${courseId}/assignments/${assignmentId}/submit`}>
                            Back to Assignment
                        </Link>
                    </Button>
                    <Button asChild className="flex-1">
                        <Link href={`/student/courses/${courseId}/assignments`}>
                            View All Assignments
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    // ==================== ACTIVE VIVA STATE ====================
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
            {/* Header */}
            <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <SessionTimer startTime={sessionStartTime} />
                    <Separator orientation="vertical" className="h-5" />
                    <Badge variant="outline" className="font-medium">
                        Question {questionNumber} of 5
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-sm">
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            connectionStatus === 'connected' ? "bg-green-500" : "bg-yellow-500 animate-pulse"
                        )} />
                        <span className="text-muted-foreground text-xs">
                            {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
                        </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={endSession} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <LogOut className="h-4 w-4 mr-2" />
                        End Session
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Main Session */}
                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                    {/* IVAS Instructor Card */}
                    <Card className="bg-zinc-900 border-zinc-800 text-white overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">IVAS Instructor</h3>
                                        <p className="text-xs text-zinc-400">
                                            {vivaState === 'playing_question' && 'Speaking...'}
                                            {vivaState === 'listening' && (isRecording ? 'Listening...' : 'Ready for answer')}
                                            {vivaState === 'processing' && 'Processing...'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-green-400">
                                    <div className="w-2 h-2 rounded-full bg-green-400" />
                                    Connected
                                </div>
                            </div>

                            {/* Waveform Visualization */}
                            <div className="flex items-center justify-center py-4">
                                <AudioWaveform 
                                    isActive={vivaState === 'playing_question' || isRecording} 
                                    level={isRecording ? audioLevel : vivaState === 'playing_question' ? 50 : 0} 
                                />
                            </div>

                            {/* Current Question */}
                            {currentQuestion && (
                                <div className="mt-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                                    <p className="text-xs text-zinc-400 uppercase tracking-wider mb-2">Current Question</p>
                                    <p className="text-sm leading-relaxed">{currentQuestion.question_text}</p>
                                </div>
                            )}

                            {/* Live Transcription */}
                            <div className="mt-4 p-4 bg-zinc-800/30 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Mic className="h-3 w-3 text-zinc-400" />
                                    <span className="text-xs text-zinc-400 uppercase tracking-wider">Live Transcription</span>
                                </div>
                                <p className="text-sm text-zinc-300 min-h-[40px]">
                                    {liveTranscript || (
                                        <span className="text-zinc-500 italic">
                                            {vivaState === 'playing_question' ? 'Wait for the question to finish...' : 'Click record to speak your answer...'}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Progress */}
                    <div className="mt-4">
                        <Progress value={(questionNumber / 5) * 100} className="h-1" />
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Control Bar */}
                    <div className="mt-4 flex items-center justify-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 rounded-full"
                            onClick={() => setIsMuted(!isMuted)}
                        >
                            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        </Button>

                        {/* Record Button */}
                        {vivaState === 'listening' && (
                            <Button
                                size="lg"
                                className={cn(
                                    "h-16 w-16 rounded-full transition-all",
                                    isRecording
                                        ? "bg-red-500 hover:bg-red-600 animate-pulse"
                                        : "bg-primary hover:bg-primary/90"
                                )}
                                onClick={isRecording ? stopRecording : startRecording}
                            >
                                {isRecording ? (
                                    <StopCircle className="h-7 w-7" />
                                ) : (
                                    <Mic className="h-7 w-7" />
                                )}
                            </Button>
                        )}

                        {vivaState === 'processing' && (
                            <Button size="lg" className="h-16 w-16 rounded-full" disabled>
                                <Loader2 className="h-7 w-7 animate-spin" />
                            </Button>
                        )}

                        {vivaState === 'playing_question' && (
                            <Button size="lg" className="h-16 w-16 rounded-full bg-blue-500" disabled>
                                <Volume2 className="h-7 w-7 animate-pulse" />
                            </Button>
                        )}

                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-xs">
                            <Radio className={cn("h-3 w-3", isRecording ? "text-red-500" : "text-muted-foreground")} />
                            VAD
                        </div>

                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-full">
                            <Settings className="h-5 w-5" />
                        </Button>

                        <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-full px-4"
                            onClick={endSession}
                        >
                            End
                        </Button>
                    </div>
                </div>

                {/* Right Panel - Session History */}
                <div className="w-80 border-l bg-card flex flex-col shrink-0 overflow-hidden">
                    <div className="p-4 border-b shrink-0">
                        <h2 className="font-semibold flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Session History
                        </h2>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="p-4 space-y-4">
                                {conversationHistory.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        No questions answered yet.
                                    </p>
                                ) : (
                                    conversationHistory.map((entry, i) => (
                                        <div key={i} className="space-y-2 pb-4 border-b last:border-0">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="outline" className="text-[10px]">Q{entry.question_number}</Badge>
                                                <Badge className={cn("text-[10px]", getLevelColor(entry.understanding_level))}>
                                                    {entry.score}
                                                </Badge>
                                            </div>
                                            <div className="text-xs bg-muted/50 p-2 rounded">
                                                <p className="font-medium text-muted-foreground mb-1">Q:</p>
                                                <p className="line-clamp-2">{entry.question_text}</p>
                                            </div>
                                            <div className="text-xs bg-primary/5 p-2 rounded">
                                                <p className="font-medium text-muted-foreground mb-1">A:</p>
                                                <p className="line-clamp-3">{entry.answer_text}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={historyEndRef} />
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Concepts Section */}
                    <div className="p-4 border-t shrink-0">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                            Concepts
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {conversationHistory.length > 0
                                ? "Strengths detected in your answers will appear here."
                                : "Strengths will appear after assessment."}
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
                    <Alert variant="destructive" className="w-auto">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </div>
            )}
        </div>
    );
}
