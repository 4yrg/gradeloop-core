"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Volume2 } from "lucide-react";

interface VoiceInterfaceProps {
    isAiSpeaking: boolean;
    isUserSpeaking: boolean;
    transcription: string;
    audioLevel?: number; // 0-1 for visualizer
}

export function VoiceInterface({ isAiSpeaking, isUserSpeaking, transcription, audioLevel = 0 }: VoiceInterfaceProps) {
    // Waveform bars
    const bars = Array.from({ length: 12 });
    const [barHeights, setBarHeights] = useState<number[]>(bars.map(() => 8));

    // Update bar heights based on audio level when user is speaking
    useEffect(() => {
        if (isUserSpeaking && audioLevel > 0) {
            const newHeights = bars.map((_, i) => {
                const variance = Math.sin(Date.now() / 100 + i) * 0.3 + 0.7;
                return Math.max(8, audioLevel * 100 * variance);
            });
            setBarHeights(newHeights);
        } else if (!isAiSpeaking && !isUserSpeaking) {
            setBarHeights(bars.map(() => 8));
        }
    }, [audioLevel, isUserSpeaking, isAiSpeaking]);

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

            {/* Central Visualizer */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex items-end gap-1.5 h-32">
                    {bars.map((_, i) => (
                        <div
                            key={i}
                            className={`w-3 rounded-full transition-all duration-100 ease-in-out ${
                                isAiSpeaking 
                                    ? 'bg-primary animate-waveform' 
                                    : isUserSpeaking 
                                        ? 'bg-green-500' 
                                        : 'bg-zinc-700'
                            }`}
                            style={{
                                animationDelay: isAiSpeaking ? `${i * 0.05}s` : undefined,
                                height: isAiSpeaking 
                                    ? `${Math.max(20, Math.random() * 100)}%` 
                                    : isUserSpeaking
                                        ? `${barHeights[i]}%`
                                        : '8px',
                                opacity: isAiSpeaking || isUserSpeaking ? 1 : 0.2
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* User Speech / Transcription Zone */}
            <div className="relative p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                <div className={`flex items-end gap-4 transition-all duration-300 ${isUserSpeaking ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-50'}`}>
                    <div className={`h-10 w-10 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isUserSpeaking 
                            ? 'bg-green-500/20 border-green-500 text-green-500' 
                            : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                    }`}>
                        <Mic className={`h-5 w-5 ${isUserSpeaking ? 'animate-pulse' : ''}`} />
                    </div>
                    <div className="flex-1">
                        <div className="text-xs text-zinc-400 mb-1 uppercase tracking-wider font-semibold">
                            {isUserSpeaking ? 'Recording...' : 'Live Transcription'}
                        </div>
                        <p className="text-lg text-white font-medium leading-relaxed">
                            {transcription || (
                                <span className="text-zinc-600 italic">
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
    );
}
