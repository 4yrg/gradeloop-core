"use client"

import { Button } from "@/components/ui/button"
import { Play, Send, ArrowLeft, Clock } from "lucide-react"
import Link from "next/link"

interface IdeHeaderProps {
    isExecuting: boolean
    isSubmitting: boolean
    onRun: () => void
    onSubmit: () => void
    assignmentTitle: string
}

export function IdeHeader({ isExecuting, isSubmitting, onRun, onSubmit, assignmentTitle }: IdeHeaderProps) {
    return (
        <div className="flex h-14 items-center justify-between border-b bg-background px-4">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/student/dashboard">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div className="flex flex-col">
                    <h1 className="text-sm font-semibold">{assignmentTitle}</h1>
                    <span className="text-xs text-muted-foreground">Main.java</span>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <div className="hidden md:flex items-center text-sm font-mono bg-muted px-3 py-1 rounded-md mr-4">
                    <Clock className="w-4 h-4 mr-2" />
                    01:45:22
                </div>

                <Button
                    size="sm"
                    variant="outline"
                    onClick={onRun}
                    disabled={isExecuting || isSubmitting}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/50"
                >
                    <Play className="mr-2 h-4 w-4" />
                    Run
                </Button>

                <Button
                    size="sm"
                    onClick={onSubmit}
                    disabled={isExecuting || isSubmitting}
                >
                    <Send className="mr-2 h-4 w-4" />
                    Submit
                </Button>

                <div className="w-px h-6 bg-border mx-2" />
                {/* Placeholder for theme toggle or profile if needed */}
                <div className="w-8 h-8 rounded-full bg-muted" />
            </div>
        </div>
    )
}
