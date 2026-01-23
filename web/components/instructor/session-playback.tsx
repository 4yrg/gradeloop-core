'use client';

import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Maximize2 } from 'lucide-react';
import { Badge } from '../ui/badge';

interface SessionPlaybackProps {
    code: string;
    language: string;
    duration: number;
    onTimeChange?: (time: number) => void;
}

export function SessionPlayback({ code, language, duration, onTimeChange }: SessionPlaybackProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [displayedCode, setDisplayedCode] = useState('');
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const totalChars = code.length;
    const charsPerSecond = totalChars / duration;

    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                setCurrentTime((prev) => {
                    const newTime = Math.min(prev + (0.1 * playbackSpeed), duration);
                    if (newTime >= duration) {
                        setIsPlaying(false);
                        return duration;
                    }
                    return newTime;
                });
            }, 100);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isPlaying, duration, playbackSpeed]);

    useEffect(() => {
        const charsToShow = Math.floor((currentTime / duration) * totalChars);
        setDisplayedCode(code.substring(0, charsToShow));
        onTimeChange?.(currentTime);
    }, [currentTime, code, duration, totalChars, onTimeChange]);

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleReset = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        setDisplayedCode('');
    };

    const handleSkipBackward = () => {
        setCurrentTime((prev) => Math.max(0, prev - 10));
    };

    const handleSkipForward = () => {
        setCurrentTime((prev) => Math.min(duration, prev + 10));
    };

    const handleSliderChange = (value: number[]) => {
        setCurrentTime(value[0]);
        setIsPlaying(false);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = (currentTime / duration) * 100;
    const charsTyped = displayedCode.length;
    const currentWPM = Math.round((charsTyped / 5) / (currentTime / 60) || 0);

    return (
        <Card className="flex flex-col">
            <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Session Playback</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Replay how the code was written over time
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-xs text-muted-foreground">Typing Speed</div>
                            <div className="text-lg font-bold">{currentWPM} WPM</div>
                        </div>
                        <Badge variant="outline" className="font-mono">
                            {language}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
                {/* Code Editor */}
                <div className="flex-1 min-h-[400px] relative">
                    <Editor
                        height="100%"
                        language={language}
                        value={displayedCode}
                        theme="vs-dark"
                        options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            fontSize: 14,
                            lineNumbers: 'on',
                            renderLineHighlight: 'none',
                            overviewRulerLanes: 0,
                            hideCursorInOverviewRuler: true,
                            overviewRulerBorder: false,
                            scrollbar: {
                                vertical: 'visible',
                                horizontal: 'visible',
                                verticalScrollbarSize: 10,
                                horizontalScrollbarSize: 10
                            }
                        }}
                    />
                    {displayedCode.length === 0 && !isPlaying && currentTime === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] text-gray-400">
                            <div className="text-center">
                                <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Press play to start session replay</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Playback Controls */}
                <div className="border-t bg-muted/30 p-4 space-y-3">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <Slider
                            value={[currentTime]}
                            max={duration}
                            step={0.1}
                            onValueChange={handleSliderChange}
                            className="cursor-pointer"
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{formatTime(currentTime)}</span>
                            <span className="font-mono">
                                {charsTyped} / {totalChars} chars ({Math.round(progress)}%)
                            </span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleReset}
                                disabled={currentTime === 0}
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleSkipBackward}
                                disabled={currentTime === 0}
                            >
                                <SkipBack className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon"
                                onClick={handlePlayPause}
                                className="h-10 w-10"
                            >
                                {isPlaying ? (
                                    <Pause className="h-5 w-5" />
                                ) : (
                                    <Play className="h-5 w-5 ml-0.5" />
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleSkipForward}
                                disabled={currentTime >= duration}
                            >
                                <SkipForward className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Speed:</span>
                            {[0.5, 1, 1.5, 2].map((speed) => (
                                <Button
                                    key={speed}
                                    variant={playbackSpeed === speed ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setPlaybackSpeed(speed)}
                                    className="h-7 px-3 text-xs"
                                >
                                    {speed}x
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
