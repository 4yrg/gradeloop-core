"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Step1CourseOutline } from "./step-1-course-outline"
import { Step2ConfigureAutograder } from "./step-2-configure-autograder"
import { Step3ConfigureCloneDetector } from "./step-3-configure-clone-detector"
import { Step4ConfigureViva } from "./step-4-configure-viva"
import { Step5ManageSubmissions } from "./step-5-manage-submissions"
import { Step6GradeSubmissions } from "./step-6-grade-submissions"
import { Step7ReviewGrades } from "./step-7-review-grades"

interface AssignmentFlowProps {
    courseId: string
    assignmentId: string
}

export function AssignmentFlow({ courseId, assignmentId }: AssignmentFlowProps) {
    const searchParams = useSearchParams()
    const currentStep = Number(searchParams.get("step")) || 1

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
            <div className="flex-1 overflow-auto">
                {currentStep === 1 && <Step1CourseOutline />}
                {currentStep === 2 && <Step2ConfigureAutograder />}
                {currentStep === 3 && <Step3ConfigureCloneDetector />}
                {currentStep === 4 && <Step4ConfigureViva />}
                {currentStep === 5 && <Step5ManageSubmissions />}
                {currentStep === 6 && <Step6GradeSubmissions />}
                {currentStep === 7 && <Step7ReviewGrades />}
            </div>
        </div>
    )
}
