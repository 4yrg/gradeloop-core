"use client";

import { Button } from "@/components/ui/button";
import { Mic, MicOff, Settings, Volume2, Loader2, StopCircle } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ControlBarProps {
    isMuted: boolean;
    onToggleMute: () => void;
    isProcessing?: boolean;
    isAiSpeaking?: boolean;
    isRecording?: boolean;
    audioLevel?: number; // 0-1
    onEndSession?: () => void;
    vadEnabled?: boolean;
    onToggleVad?: () => void;
}

export function ControlBar({ 
    isMuted, 
    onToggleMute,
    isProcessing = false,
    isAiSpeaking = false,
    isRecording = false,
    audioLevel = 0,
    onEndSession,
    vadEnabled = true,
    onToggleVad
}: ControlBarProps) {
    const isDisabled = isProcessing || isAiSpeaking;
    
    // Determine mic button state
    const getMicButtonState = () => {
        if (isProcessing) return { variant: "secondary" as const, icon: <Loader2 className="h-6 w-6 animate-spin" /> };
        if (isAiSpeaking) return { variant: "outline" as const, icon: <Volume2 className="h-6 w-6 animate-pulse" /> };
        if (isMuted) return { variant: "destructive" as const, icon: <MicOff className="h-6 w-6" /> };
        return { variant: "default" as const, icon: <Mic className="h-6 w-6" /> };
    };
    
    const micState = getMicButtonState();
    
    return (
        <div className="h-20 border-t bg-background flex items-center justify-between px-6">
            <div className="flex items-center gap-4 w-1/3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Volume2 className="h-4 w-4" />
                    <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-primary transition-all duration-100" 
                            style={{ width: `${Math.min(100, audioLevel * 100)}%` }}
                        />
                    </div>
                </div>
                {isRecording && (
                    <div className="flex items-center gap-1.5 text-xs text-green-600">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        Recording
                    </div>
                )}
            </div>

            <div className="flex items-center justify-center gap-4 w-1/3">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="lg"
                                variant={micState.variant}
                                className={`h-14 w-14 rounded-full shadow-lg transition-all ${
                                    !isMuted && !isDisabled ? 'bg-primary hover:bg-primary/90' : ''
                                } ${isRecording ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
                                onClick={onToggleMute}
                                disabled={isDisabled}
                            >
                                {micState.icon}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>
                                {isProcessing 
                                    ? "Processing..." 
                                    : isAiSpeaking 
                                        ? "AI is speaking" 
                                        : isMuted 
                                            ? "Unmute Microphone" 
                                            : "Mute Microphone"}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <div className="flex items-center justify-end gap-3 w-1/3">
                <Toggle 
                    variant="outline" 
                    aria-label="Toggle voice activity detection"
                    pressed={vadEnabled}
                    onPressedChange={onToggleVad}
                >
                    <span className="text-xs font-medium mr-2">VAD</span>
                    <div className={`h-2 w-2 rounded-full ${vadEnabled ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                </Toggle>
                <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                </Button>
                {onEndSession && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={onEndSession}
                                    className="gap-1.5"
                                >
                                    <StopCircle className="h-4 w-4" />
                                    End
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>End viva session</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
        </div>
    );
}
