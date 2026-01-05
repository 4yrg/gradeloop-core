"use client";

import { Button } from "../../../ui/button";
import { Mic, MicOff, Settings, Volume2 } from "lucide-react";
import { Toggle } from "../../../ui/toggle";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../../../ui/tooltip";

interface ControlBarProps {
    isMuted: boolean;
    onToggleMute: () => void;
}

export function ControlBar({ isMuted, onToggleMute }: ControlBarProps) {
    return (
        <div className="h-20 border-t bg-background flex items-center justify-between px-6">
            <div className="flex items-center gap-4 w-1/3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Volume2 className="h-4 w-4" />
                    <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[70%]" />
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-center gap-4 w-1/3">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="lg"
                                variant={isMuted ? "destructive" : "default"}
                                className={`h-14 w-14 rounded-full shadow-lg transition-all ${isMuted ? '' : 'bg-primary hover:bg-primary/90'}`}
                                onClick={onToggleMute}
                            >
                                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{isMuted ? "Unmute Microphone" : "Mute Microphone"}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <div className="flex items-center justify-end gap-3 w-1/3">
                <Toggle variant="outline" aria-label="Toggle auto-detect">
                    <span className="text-xs font-medium mr-2">VAD</span>
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                </Toggle>
                <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                </Button>
            </div>
        </div>
    );
}
