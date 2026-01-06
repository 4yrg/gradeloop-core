"use client";

import { useEffect, useState, useRef } from "react";
import { Mic, Volume2 } from "lucide-react";

interface VoiceInterfaceProps {
    isAiSpeaking: boolean;
    isUserSpeaking: boolean;
    transcription: string;
    audioLevel?: number; // 0-1 for visualizer
    currentQuestion?: string; // The AI's current question being spoken
}

export function VoiceInterface({ isAiSpeaking, isUserSpeaking, transcription, audioLevel = 0, currentQuestion }: VoiceInterfaceProps) {
    // Live typing effect state
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll when text updates
    useEffect(() => {
        if (scrollContainerRef.current) {
            const { scrollHeight, clientHeight } = scrollContainerRef.current;
            if (scrollHeight > clientHeight) {
                scrollContainerRef.current.scrollTop = scrollHeight;
            }
        }
    }, [displayedText]);

    // Typewriter effect for AI question
    useEffect(() => {
        if (!currentQuestion) {
            setDisplayedText("");
            setIsTyping(false);
            return;
        }

        // Reset and start typing
        setDisplayedText("");
        setIsTyping(true);
        let index = 0;

        const interval = setInterval(() => {
            if (index < currentQuestion.length) {
                setDisplayedText(currentQuestion.slice(0, index + 1));
                index++;
            } else {
                setIsTyping(false);
                clearInterval(interval);
            }
        }, 50); // 50ms per character

        return () => clearInterval(interval);
    }, [currentQuestion]);

    return (
        <div className="relative flex flex-col justify-end min-h-[300px] w-full bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
            {/* Background Ambient Effect */}
            <div className={`absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent transition-opacity duration-1000 ${isAiSpeaking ? 'opacity-100' : 'opacity-0'}`} />

            {/* User speaking ambient effect */}
            <div className={`absolute inset-0 bg-gradient-to-b from-green-500/5 via-transparent to-transparent transition-opacity duration-500 ${isUserSpeaking ? 'opacity-100' : 'opacity-0'}`} />

            {/* AI Status Indicator */}
            <div className="absolute top-6 left-6 right-6 flex items-start justify-between">
                <div className={`flex items-center gap-3 transition-opacity duration-300 ${isAiSpeaking ? 'opacity-100' : 'opacity-50'}`}>
                    <div className="relative h-10 w-10">
                        <div className={`absolute inset-0 bg-primary/20 rounded-full animate-ping ${isAiSpeaking ? 'opacity-100' : 'opacity-0'}`} />
                        <div className="relative h-10 w-10 rounded-full bg-primary/20 border border-primary text-primary flex items-center justify-center font-bold">
                            <Volume2 className={`h-5 w-5 ${isAiSpeaking ? 'animate-pulse' : ''}`} />
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-sm font-medium text-white">IVAS Instructor</p>
                        <p className="text-xs text-zinc-400">
                            {isAiSpeaking ? "Speaking..." : isUserSpeaking ? "Listening to you..." : "Ready"}
                        </p>
                    </div>
                </div>

                {/* Connection indicator */}
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-zinc-500">Connected</span>
                </div>
            </div>

            {/* AI Question Display - Live typing text centered with scroll */}
            <div className="absolute inset-x-0 top-16 bottom-24 flex items-center justify-center px-6 md:px-12">
                <div className="text-center max-w-3xl w-full h-full flex items-center justify-center overflow-hidden">
                    <div className="max-h-full overflow-y-auto px-2 py-4 pointer-events-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                        {currentQuestion ? (
                            <p className={`font-medium leading-relaxed text-white transition-opacity duration-300 whitespace-pre-wrap ${isAiSpeaking || isTyping ? 'opacity-100' : 'opacity-80'} ${currentQuestion.length > 200 ? 'text-base md:text-lg' : currentQuestion.length > 150 ? 'text-lg md:text-xl' : currentQuestion.length > 80 ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}`}>
                                {displayedText}
                                {isTyping && (
                                    <span className="inline-block w-0.5 h-5 bg-white ml-1 animate-pulse align-middle" />
                                )}
                            </p>
                        ) : (
                            <p className="text-xl text-zinc-500 italic">
                                {isAiSpeaking ? 'Preparing question...' : 'Waiting for AI...'}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* User Speech / Transcription Zone */}
            <div className="relative p-4 bg-gradient-to-t from-black via-black/90 to-transparent">
                <div className={`flex items-start gap-3 transition-all duration-300 ${isUserSpeaking ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-60'}`}>
                    <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 transition-colors mt-0.5 ${isUserSpeaking
                        ? 'bg-green-500/20 border-green-500 text-green-500'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                        }`}>
                        <Mic className={`h-4 w-4 ${isUserSpeaking ? 'animate-pulse' : ''}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider font-semibold">
                            {isUserSpeaking ? 'Recording...' : 'Your Response'}
                        </div>
                        <div className="max-h-16 overflow-y-auto">
                            <p className={`text-white font-medium leading-snug ${transcription && transcription.length > 100 ? 'text-sm' : 'text-base'}`}>
                                {transcription || (
                                    <span className="text-zinc-600 italic text-sm">
                                        {isUserSpeaking
                                            ? 'Speak now...'
                                            : isAiSpeaking
                                                ? 'Wait for the question to finish...'
                                                : 'Click the microphone button to answer'}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
