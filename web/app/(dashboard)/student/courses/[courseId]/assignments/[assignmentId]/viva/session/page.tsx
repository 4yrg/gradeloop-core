"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/student/viva/session/TopBar";
import { QuestionDisplay } from "@/components/student/viva/session/QuestionDisplay";
import { VoiceInterface } from "@/components/student/viva/session/VoiceInterface";
import { ControlBar } from "@/components/student/viva/session/ControlBar";
import { SessionSidebar } from "@/components/student/viva/session/SessionSidebar";
import { useIvas } from "@/hooks/use-ivas";
import { useAudioCapture } from "@/hooks/use-audio-capture";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Wifi, WifiOff } from "lucide-react";

// Mock code for now - in real app, this would come from the assignment
const MOCK_CODE = `
def fibonacci(n):
    """Calculate the nth Fibonacci number."""
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    else:
        return fibonacci(n-1) + fibonacci(n-2)
`;

export default function VivaSessionPage({
    params
}: {
    params: Promise<{ courseId: string; assignmentId: string }>
}) {
    const { courseId, assignmentId } = use(params);
    const router = useRouter();

    // Session duration (10 minutes)
    const [timeLeft, setTimeLeft] = useState(600);
    const [sessionStarted, setSessionStarted] = useState(false);

    // IVAS Hook - connects to WebSocket and manages session
    const ivas = useIvas({
        code: MOCK_CODE,
        topic: "Recursion and Data Structures",
        studentId: "current-user", // TODO: Get from auth
        assignmentId: assignmentId,
        onSessionEnd: (assessment) => {
            console.log("Session ended with assessment:", assessment);
            // Store assessment in session storage for results page
            sessionStorage.setItem(`viva-result-${assignmentId}`, JSON.stringify(assessment));
            router.push(`/student/courses/${courseId}/assignments/${assignmentId}/viva/results`);
        },
        onError: (error) => {
            console.error("IVAS Error:", error);
        },
    });

    // Audio Capture Hook
    const audioCapture = useAudioCapture({
        onAudioChunk: (chunk) => {
            // Convert ArrayBuffer to base64 and send
            const base64 = arrayBufferToBase64(chunk);
            ivas.sendAudioChunk(base64);
        },
        onStop: (blob) => {
            console.log("Recording stopped, blob size:", blob.size);
        },
    });

    // Timer Effect
    useEffect(() => {
        if (!sessionStarted || ivas.state === 'ended') return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [sessionStarted, ivas.state]);

    // End session when time runs out
    useEffect(() => {
        if (timeLeft === 0 && ivas.state !== 'ended') {
            ivas.endSession();
        }
    }, [timeLeft, ivas.state, ivas.endSession]);

    // Handle starting the session (requires user interaction for audio)
    const handleStartSession = useCallback(() => {
        setSessionStarted(true);
        ivas.startSession();
    }, [ivas]);

    // Handle end session
    const handleEndSession = useCallback(() => {
        if (audioCapture.isRecording) {
            audioCapture.stopRecording();
        }
        ivas.endSession();
    }, [audioCapture, ivas]);

    // Handle microphone toggle
    const handleToggleMic = useCallback(async () => {
        if (audioCapture.isRecording) {
            audioCapture.stopRecording();
            ivas.stopSpeaking();
        } else {
            // Request permission if needed
            if (audioCapture.hasPermission === null) {
                await audioCapture.requestPermission();
            }
            if (audioCapture.hasPermission !== false) {
                ivas.startSpeaking();
                audioCapture.startRecording();
            }
        }
    }, [audioCapture, ivas]);

    // Idle state - show start button (required for browser audio autoplay policy)
    if (ivas.state === 'idle' && !sessionStarted) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background">
                <div className="text-center space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold">Viva Session</h1>
                        <p className="text-muted-foreground">AI-Powered Concept Assessment</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-6 max-w-md space-y-4">
                        <p className="text-sm text-muted-foreground">
                            You will be asked conceptual questions about your code.
                            The AI will assess your understanding through a voice conversation.
                        </p>
                        <ul className="text-sm text-left space-y-2 text-muted-foreground">
                            <li>• Duration: ~10 minutes</li>
                            <li>• Questions: 5-7 conceptual questions</li>
                            <li>• Microphone required</li>
                        </ul>
                    </div>
                    <button
                        onClick={handleStartSession}
                        className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors text-lg"
                    >
                        Start Viva Session
                    </button>
                </div>
            </div>
        );
    }

    // Loading state
    if (ivas.state === 'connecting') {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">Connecting to IVAS...</p>
                <p className="text-sm text-muted-foreground mt-2">Setting up your viva session</p>
            </div>
        );
    }

    // Error state
    if (ivas.state === 'error' && ivas.error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background p-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <p className="font-medium">Connection Error</p>
                        <p className="text-sm mt-1">{ivas.error}</p>
                        <button
                            onClick={() => ivas.startSession()}
                            className="mt-4 text-sm underline"
                        >
                            Try Again
                        </button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
            {/* Top Bar */}
            <TopBar
                timeLeft={timeLeft}
                currentQuestionIndex={ivas.questionNumber}
                totalQuestions={5} // Estimated
                onEndSession={handleEndSession}
            />

            {/* Connection Status Banner */}
            {!ivas.isConnected && ivas.state !== 'idle' && ivas.state !== 'ended' && (
                <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 flex items-center justify-center gap-2 text-yellow-600 dark:text-yellow-400">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-sm">Connection lost. Attempting to reconnect...</span>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 p-8 md:p-12 overflow-y-auto max-w-5xl mx-auto w-full flex flex-col justify-center gap-12">

                        {/* Question Zone */}
                        <div className="flex-1 flex items-center">
                            <QuestionDisplay
                                question={ivas.currentQuestion || "Preparing your first question..."}
                                codeSnippet={MOCK_CODE}
                                concepts={["Recursion", "Data Structures"]}
                            />
                        </div>

                        {/* Interactive Zone */}
                        <div className="w-full">
                            <VoiceInterface
                                isAiSpeaking={ivas.state === 'ai_speaking' || ivas.isAudioPlaying}
                                isUserSpeaking={audioCapture.isRecording}
                                transcription={ivas.userTranscript || ""}
                                audioLevel={audioCapture.audioLevel}
                            />
                        </div>
                    </div>

                    {/* Controls */}
                    <ControlBar
                        isMuted={!audioCapture.isRecording}
                        onToggleMute={handleToggleMic}
                        isProcessing={ivas.state === 'processing'}
                        isAiSpeaking={ivas.state === 'ai_speaking' || ivas.isAudioPlaying}
                        isRecording={audioCapture.isRecording}
                        audioLevel={audioCapture.audioLevel}
                        onEndSession={handleEndSession}
                    />
                </div>

                {/* Sidebar */}
                <SessionSidebar
                    history={ivas.conversationHistory}
                    assessment={ivas.finalAssessment}
                    isProcessing={ivas.state === 'processing'}
                />
            </div>
        </div>
    );
}

// Helper function
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
