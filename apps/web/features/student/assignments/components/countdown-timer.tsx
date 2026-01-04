"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
    deadline: string;
    className?: string;
}

export function CountdownTimer({ deadline, className }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    } | null>(null);

    useEffect(() => {
        const target = new Date(deadline).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const difference = target - now;

            if (difference <= 0) {
                setTimeLeft(null);
                return;
            }

            setTimeLeft({
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((difference % (1000 * 60)) / 1000),
            });
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [deadline]);

    if (!timeLeft) {
        return (
            <div className={cn("text-destructive font-medium flex items-center gap-2", className)}>
                <Clock className="h-4 w-4" />
                <span>Deadline passed</span>
            </div>
        );
    }

    return (
        <div className={cn("text-muted-foreground font-medium flex items-center gap-2", className)}>
            <Clock className="h-4 w-4" />
            <span>
                {timeLeft.days > 0 && `${timeLeft.days}d `}
                {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
            </span>
        </div>
    );
}
