"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "../../../../../../../../../components/student/viva/session/TopBar";
import { QuestionDisplay } from "../../../../../../../../../components/student/viva/session/QuestionDisplay";
import { VoiceInterface } from "../../../../../../../../../components/student/viva/session/VoiceInterface";
import { ControlBar } from "../../../../../../../../../components/student/viva/session/ControlBar";
import { SessionSidebar } from "../../../../../../../../../components/student/viva/session/SessionSidebar";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../../../../../../../../../components/ui/resizable";

export default function VivaSessionPage({
    params
}: {
    params: Promise<{ courseId: string; assignmentId: string }>
}) {
    const { courseId, assignmentId } = use(params);
    const router = useRouter();

    // State
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [transcription, setTranscription] = useState("");

    // Mock Data
    const questions = [
        {
            text: "Explain how you would balance this AVL tree after inserting the node 15.",
            code: "      20\n     /  \\\n   10    30\n  /  \\\n 5    12\n       \\ \n        15 (Inserted)",
            concepts: ["AVL Trees", "Rotations"]
        },
        {
            text: "What is the worst-case time complexity of this function?",
            code: "function search(root, key) {\n  if (!root || root.key === key) return root;\n  return search(root.key < key ? root.right : root.left, key);\n}",
            concepts: ["Big O", "Recursion"]
        },
        {
            text: "Describe the memory implications of using a recursive approach here.",
            concepts: ["Stack Memory", "Space Complexity"]
        }
    ];

    // Timer Logic
    useEffect(() => {
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
    }, []);

    // Simulation of interaction loop (Mock)
    useEffect(() => {
        // Start with AI speaking
        if (currentQuestionIndex === 0 && timeLeft === 599) {
            setIsAiSpeaking(true);
            setTimeout(() => setIsAiSpeaking(false), 3000);
        }
    }, [currentQuestionIndex, timeLeft]);

    const handleEndSession = () => {
        router.push(`/student/courses/${courseId}/assignments/${assignmentId}/viva/results`);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setTranscription("");
            // Simulate AI asking new question
            setIsAiSpeaking(true);
            setTimeout(() => setIsAiSpeaking(false), 2000);
        } else {
            handleEndSession();
        }
    };

    // Keyboard shortcut for Next (Dev only)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' && e.shiftKey) {
                handleNextQuestion();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentQuestionIndex]);


    return (
        <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
            {/* Top Bar */}
            <TopBar
                timeLeft={timeLeft}
                currentQuestionIndex={currentQuestionIndex}
                totalQuestions={questions.length}
                onEndSession={handleEndSession}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 p-8 md:p-12 overflow-y-auto max-w-5xl mx-auto w-full flex flex-col justify-center gap-12">

                        {/* Question Zone */}
                        <div className="flex-1 flex items-center">
                            <QuestionDisplay
                                question={questions[currentQuestionIndex].text}
                                codeSnippet={questions[currentQuestionIndex].code}
                                concepts={questions[currentQuestionIndex].concepts}
                            />
                        </div>

                        {/* Interactive Zone */}
                        <div className="w-full">
                            <VoiceInterface
                                isAiSpeaking={isAiSpeaking}
                                isUserSpeaking={isUserSpeaking}
                                transcription={transcription}
                            />
                        </div>
                    </div>

                    {/* Controls */}
                    <ControlBar
                        isMuted={isMuted}
                        onToggleMute={() => setIsMuted(!isMuted)}
                    />
                </div>

                {/* Sidebar (Collapsible in real app, static for now as per design) */}
                <SessionSidebar history={[]} />
            </div>
        </div>
    );
}
