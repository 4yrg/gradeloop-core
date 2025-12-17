"use client"

import { useIdeStore } from "@/store/ide/use-ide-store"
import Editor, { DiffEditor, OnMount } from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { X, Circle, SplitSquareHorizontal, Code2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect, useRef } from "react"
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
        setActiveSelection,
        annotations
    } = useIdeStore()

    const { theme } = useTheme()
    const editorRef = useRef<any>(null)
    const decorationIdsRef = useRef<string[]>([])

    const activeFile = files.find(f => f.id === activeFileId)

    // Get file objects for open tabs
    const openFileObjects = openFiles.map(id => files.find(f => f.id === id)).filter(Boolean) as typeof files

    useEffect(() => {
        const editor = editorRef.current
        if (!editor || !activeFileId) return

        const currentAnnotations = annotations.filter(a => a.fileId === activeFileId)
        const newDecorations = currentAnnotations.map(a => ({
            range: {
                startLineNumber: a.line,
                startColumn: 1,
                endLineNumber: a.endLine || a.line,
                endColumn: 1
            },
            options: {
                isWholeLine: false,
                glyphMarginClassName: 'annotation-glyph text-primary', // Use primary color
                inlineClassName: 'annotation-inline',
            }
        }))

        // @ts-ignore
        decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, newDecorations)

    }, [activeFileId, annotations, activeFile])

    const handleEditorMount: OnMount = (editor, monaco) => {
        editorRef.current = editor

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
        // Add hover provider for annotations
        // We use a disposable list to track registrations if we needed to unmount cleanly, 
        // but for this simple case, we'll register it once per editor instance or just global
        // Ideally should store the disposable
        if (activeFile) {
            monaco.languages.registerHoverProvider(activeFile.language, {
                // @ts-ignore - Monaco types might be slightly mismatched in this context
                provideHover: (model, position) => {
                    // Find annotations for this line
                    const lineAnnotations = annotations.filter(a =>
                        a.fileId === activeFileId &&
                        position.lineNumber >= a.line &&
                        position.lineNumber <= (a.endLine || a.line)
                    )

                    if (lineAnnotations.length === 0) return null

                    return {
                        range: new monaco.Range(
                            position.lineNumber,
                            1,
                            position.lineNumber,
                            model.getLineMaxColumn(position.lineNumber)
                        ),
                        contents: lineAnnotations.map(a => {
                            const latestComment = a.comments[a.comments.length - 1]
                            const content = latestComment
                                ? `**${latestComment.author}**: ${latestComment.text}\n\n*${new Date(latestComment.timestamp).toLocaleString()}*`
                                : '(No comments)'

                            return { value: content }
                        })
                    }
                }
            })
        }

        // Add Content Widgets for Annotations
        // Clear previous widgets if any (manual management required or use effect cleanup)
        // For simplicity in this iteration, we'll just add new ones. In a real app, diff them.

        annotations.filter(a => a.fileId === activeFileId).forEach(annotation => {
            const widgetId = `annotation-widget-${annotation.id}`;
            // Check if widget already exists to avoid duplicates
            // @ts-ignore
            if (editor._contentWidgets && editor._contentWidgets.hasOwnProperty(widgetId)) return;

            editor.addContentWidget({
                getId: () => widgetId,
                getDomNode: () => {
                    const domNode = document.createElement('div');
                    domNode.className = 'annotation-widget';
                    domNode.innerHTML = `<button class="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform" title="View Discussion">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </button>`;

                    domNode.onclick = (e) => {
                        e.stopPropagation();
                        setActiveSelection({
                            code: annotation.content,
                            line: annotation.line,
                            endLine: annotation.endLine,
                            fileId: annotation.fileId
                        })
                        setActivePopup('annotation'); // Re-use annotation popup for now, will update to thread view next
                    };
                    return domNode;
                },
                getPosition: () => ({
                    position: {
                        lineNumber: annotation.line,
                        column: 1 // Position at start of line or use endColumn 
                    },
                    preference: [monaco.editor.ContentWidgetPositionPreference.EXACT]
                })
            });
        });
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
                            padding: { top: 16 },
                            glyphMargin: true
                        }}
                    />
                )}
            </div>
        </div>
    )
}
