"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import Editor from "@monaco-editor/react"
import { useIDEStore } from "@/store/ide.store"
import { ideService } from "@/services/ide.service"
import { FileExplorer } from "@/components/ide/file-explorer"
import { Terminal } from "@/components/ide/terminal"
import { IdeHeader } from "@/components/ide/ide-header"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { toast } from "sonner"
// import { useToast } from "@/hooks/use-toast" // Deprecated for sonner

export default function IDELayoutPage() {
    const params = useParams()
    // const { toast } = useToast()

    const {
        files,
        activeFileId,
        activeTab,
        terminalOutput,
        isExecuting,
        isSubmitting,
        setActiveFile,
        updateFileContent,
        appendTerminalOutput,
        setExecuting,
        setSubmitting,
        clearTerminal
    } = useIDEStore()

    const activeFile = files.find(f => f.id === activeFileId)

    // Lockdown mode simulation: Request fullscreen on mount
    useEffect(() => {
        // Check if document exists (client-side)
        if (typeof document !== 'undefined') {
            const enterFullscreen = async () => {
                try {
                    if (document.documentElement.requestFullscreen) {
                        await document.documentElement.requestFullscreen()
                    }
                } catch (err) {
                    console.warn("Fullscreen denied", err)
                }
            }
            enterFullscreen()
        }
    }, [])

    const handleRun = async () => {
        if (!activeFile) return
        setExecuting(true)
        clearTerminal()
        appendTerminalOutput(`$ javac ${activeFile.name}`)

        try {
            const result = await ideService.runCode(activeFile.content)
            if (result.output) appendTerminalOutput(result.output)
            if (result.error) appendTerminalOutput(result.error)
        } catch (err) {
            appendTerminalOutput("Error executing code")
        } finally {
            setExecuting(false)
        }
    }

    const handleSubmit = async () => {
        if (!activeFile) return
        setSubmitting(true)
        toast.info("Submitting assignment...")

        try {
            const result = await ideService.submitAssignment(activeFile.content)
            toast.success(`Submission successful! Score: ${result.score}/100`)
            // In a real app, update execution results panel
        } catch (err) {
            toast.error("Submission failed")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
            <IdeHeader
                assignmentTitle="Assignment 1: Array Manipulation"
                isExecuting={isExecuting}
                isSubmitting={isSubmitting}
                onRun={handleRun}
                onSubmit={handleSubmit}
            />

            <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal">

                    <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                        <FileExplorer
                            files={files}
                            activeFileId={activeFileId}
                            onFileSelect={setActiveFile}
                        />
                    </ResizablePanel>

                    <ResizableHandle />

                    <ResizablePanel defaultSize={80}>
                        <ResizablePanelGroup direction="vertical">
                            <ResizablePanel defaultSize={70}>
                                {activeFile ? (
                                    <Editor
                                        height="100%"
                                        language={activeFile.language}
                                        theme="vs-dark"
                                        value={activeFile.content}
                                        onChange={(value) => updateFileContent(activeFile.id, value || "")}
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            wordWrap: "on",
                                            readOnly: activeFile.isReadOnly
                                        }}
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        Select a file to edit
                                    </div>
                                )}
                            </ResizablePanel>

                            <ResizableHandle />

                            <ResizablePanel defaultSize={30}>
                                <Terminal output={terminalOutput} />
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>

                </ResizablePanelGroup>
            </div>
        </div>
    )
}
