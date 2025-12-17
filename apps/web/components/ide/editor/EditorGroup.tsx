"use client"

import { useIdeStore } from "@/store/ide/use-ide-store"
import Editor, { DiffEditor, OnMount } from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { X, Circle, SplitSquareHorizontal, Code2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function EditorGroup() {
    const {
        files,
        activeFileId,
        openFiles,
        setActiveFile,
        closeFile,
        updateFileContent,
        setActivePopup,
        setActiveSelection
    } = useIdeStore()

    const { theme } = useTheme()

    const activeFile = files.find(f => f.id === activeFileId)

    // Get file objects for open tabs
    const openFileObjects = openFiles.map(id => files.find(f => f.id === id)).filter(Boolean) as typeof files

    const handleEditorMount: OnMount = (editor, monaco) => {
        // Add context menu actions
        editor.addAction({
            id: 'ask-ai',
            label: 'Ask GradeLoop AI',
            keybindings: [
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI
            ],
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1,
            run: (ed) => {
                const selection = ed.getSelection()
                const model = ed.getModel()
                if (selection && model) {
                    const code = model.getValueInRange(selection)
                    if (code.trim()) {
                        setActiveSelection({
                            code,
                            line: selection.startLineNumber,
                            endLine: selection.endLineNumber,
                            fileId: activeFileId || ''
                        })
                        setActivePopup('ask-ai')
                    }
                }
            }
        })

        editor.addAction({
            id: 'add-annotation',
            label: 'Add Annotation',
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1.5,
            run: (ed) => {
                const selection = ed.getSelection()
                const model = ed.getModel()
                if (selection && model) {
                    const code = model.getValueInRange(selection)
                    if (code.trim()) {
                        setActiveSelection({
                            code,
                            line: selection.startLineNumber,
                            endLine: selection.endLineNumber,
                            fileId: activeFileId || ''
                        })
                        setActivePopup('annotation')
                    }
                }
            }
        })

        // Mock diagnostics
        const model = editor.getModel()
        if (model) {
            monaco.editor.setModelMarkers(model, "owner", [
                {
                    startLineNumber: 4,
                    startColumn: 1,
                    endLineNumber: 4,
                    endColumn: 10,
                    message: "Consider adding type hints",
                    severity: monaco.MarkerSeverity.Info
                }
            ])
        }
    }

    if (!activeFile) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-background text-muted-foreground select-none">
                <div className="flex flex-col items-center gap-4">
                    <Code2 className="h-24 w-24 opacity-20" />
                    <div className="text-center">
                        <div className="text-2xl font-semibold mb-2">GradeLoop IDE</div>
                        <p className="text-sm">Select a file to start editing</p>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-xs bg-muted px-2 py-1 rounded">⌘P to search files</span>
                        <span className="text-xs bg-muted px-2 py-1 rounded">⇧⌘F to search</span>
                    </div>
                </div>
            </div>
        )
    }

    const [isDiffView, setIsDiffView] = useState(false)

    // ... (rest of the file logic kept same until return)

    if (!activeFile) {
        // ... (empty state)
        return (
            <div className="h-full w-full flex items-center justify-center bg-background text-muted-foreground">
                <div className="text-center">
                    <div className="text-2xl font-semibold mb-2">GradeLoop IDE</div>
                    <p className="text-sm">Select a file to start editing</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full w-full flex flex-col bg-background">
            {/* Tabs & Toolbar */}
            <div className="flex bg-muted/10 border-b shrink-0 h-9">
                <div className="flex-1 flex overflow-x-auto scrollbar-hide">
                    {openFileObjects.map(file => (
                        <div
                            key={file.id}
                            onClick={() => setActiveFile(file.id)}
                            className={cn(
                                "flex items-center gap-2 px-3 min-w-[120px] max-w-[200px] text-sm cursor-pointer border-r select-none group",
                                activeFileId === file.id ? "bg-background text-foreground border-t-2 border-t-primary" : "bg-muted/10 text-muted-foreground hover:bg-muted/20"
                            )}
                        >
                            <span className="truncate flex-1">{file.name}</span>
                            <div
                                role="button"
                                onClick={(e) => { e.stopPropagation(); closeFile(file.id) }}
                                className={cn("opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted-foreground/20", activeFileId === file.id && "opacity-100")}
                            >
                                <X className="h-3 w-3" />
                            </div>
                        </div>
                    ))}
                </div>
                {/* Editor Actions */}
                <div className="flex items-center px-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-7 w-7", isDiffView && "bg-accent text-accent-foreground")}
                        onClick={() => setIsDiffView(!isDiffView)}
                        title="Toggle Diff View"
                    >
                        <SplitSquareHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 relative">
                {isDiffView ? (
                    <DiffEditor
                        height="100%"
                        original={activeFile.content} // In a real app, this would be the original on-disk version
                        modified={activeFile.content + "\n# Modified line"} // Simulated diff
                        language={activeFile.language}
                        theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    />
                ) : (
                    <Editor
                        key={activeFile.id}
                        height="100%"
                        language={activeFile.language}
                        value={activeFile.content}
                        theme={theme === 'dark' ? 'vs-dark' : 'light'}
                        onChange={(value) => updateFileContent(activeFile.id, value || "")}
                        onMount={handleEditorMount}
                        options={{
                            minimap: { enabled: true },
                            fontSize: 14,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 16 }
                        }}
                    />
                )}
            </div>
        </div>
    )
}
