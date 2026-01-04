"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams, useParams, useRouter } from "next/navigation"
import { BaseSidebar } from "./base-sidebar"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const steps = [
    { id: 1, title: "Course Outline & Rubric" },
    { id: 2, title: "Configure Autograder" },
    { id: 3, title: "Configure Clone Detector" },
    { id: 4, title: "Configure Viva" },
    { id: 5, title: "Manage Submissions" },
    { id: 6, title: "Grade Submissions" },
    { id: 7, title: "Review Grades" },
]

export function AssignmentManageSidebar() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()
    const courseId = params?.id
    const assignmentId = params?.assignmentId

    const currentStep = Number(searchParams.get("step")) || 1

    const handleStepChange = (stepId: number) => {
        // In a real app, we might prevent navigation if previous steps are not complete
        // For now, we allow navigation to any step as per "mock persistence" and lack of validation logic access
        router.push(`/instructor/courses/${courseId}/assignments/${assignmentId}/manage?step=${stepId}`)
    }

    return (
        <BaseSidebar>
            {/* Header */}
            <div className="p-4 pb-2">
                <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary mb-4 text-muted-foreground group" asChild>
                    <Link href={`/instructor/courses/${courseId}`}>
                        <ChevronLeft className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-1" />
                        Back to Course
                    </Link>
                </Button>
                <div className="space-y-1">
                    <h1 className="font-bold text-lg tracking-tight leading-tight">Introduction to Programming</h1>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Assignment Configuration</p>
                </div>
            </div>

            {/* Steps */}
            <div className="flex-1 overflow-y-auto px-4 py-2">
                <div className="flex flex-col gap-1">
                    {steps.map((step) => {
                        const isActive = currentStep === step.id
                        const isCompleted = currentStep > step.id
                        const isUpcoming = currentStep < step.id

                        return (
                            <button
                                key={step.id}
                                onClick={() => handleStepChange(step.id)}
                                disabled={false /* Enable skipping for now, or use isUpcoming to disable if strict */}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg transition-all text-left group relative overflow-hidden",
                                    isActive && "bg-primary/5 text-primary ring-1 ring-primary/10",
                                    isCompleted && "hover:bg-muted text-muted-foreground hover:text-primary",
                                    isUpcoming && "opacity-50 text-muted-foreground hover:bg-muted/50"
                                )}
                            >
                                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}

                                {isCompleted ? (
                                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                                ) : isActive ? (
                                    <Circle className="h-5 w-5 text-primary fill-current/20 shrink-0" />
                                ) : (
                                    <Circle className="h-5 w-5 shrink-0" />
                                )}
                                <div className="flex flex-col">
                                    <span className={cn("text-sm transition-all", isActive ? "font-bold" : "font-medium")}>{step.title}</span>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </BaseSidebar>
    )
}
