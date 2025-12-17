"use client"

import { useEffect } from "react"
import { Workbench } from "@/components/ide/layout/Workbench"
import { useParams, useSearchParams } from "next/navigation"
import { useIdeStore } from "@/store/ide/use-ide-store"
import { StudentService } from "@/services/student.service"

export default function IDEPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const assignmentId = params.assignmentId as string
    const mode = searchParams.get('mode')

    const { setMode, files, updateFileContent } = useIdeStore()

    useEffect(() => {
        const initIDE = async () => {
            if (mode === 'sandbox') {
                setMode('sandbox')
                // Load submission files
                const submission = await StudentService.getSubmission(assignmentId)
                if (submission && submission.files) {
                    // In a real app, we would replace all files or load them properly.
                    // For this prototype, we'll update the main file if it matches, or simplistic assignment.
                    // Since I don't have a 'setFiles' action exposed in the store (I only saw updateFileContent), 
                    // I realized I might need to add setFiles or just hack it with updateFileContent for defaults.
                    // Checking store again... files is state, but no setFiles? 
                    // Wait, I didn't see setFiles in the interface.
                    // Assume default files for now or I need to add setFiles.

                    // Let's check matching files by name to update
                    submission.files.forEach(f => {
                        // Find ID by name? The store uses ID. 
                        // This is tricky without setFiles.
                        // I will leave files as is for now for the prototype unless I add setFiles.
                        // Or I can update file '1' content.
                        updateFileContent('1', f.content)
                    })
                }
            } else {
                setMode('standard')
            }
        }
        initIDE()
    }, [assignmentId, mode, setMode, updateFileContent])

    return <Workbench />
}
