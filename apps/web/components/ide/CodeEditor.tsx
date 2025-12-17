"use client"

import Editor from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { useIDEStore } from "@/store/useIDEStore"

export function CodeEditor() {
    const { theme } = useTheme()
    const { activeFile, updateFileContent } = useIDEStore()

    if (!activeFile) return <div className="flex items-center justify-center h-full text-muted-foreground">Select a file</div>

    return (
        <div className="h-full w-full">
            <Editor
                height="100%"
                language={activeFile.language}
                value={activeFile.content}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                onChange={(value) => updateFileContent(activeFile.name, value || "")}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                }}
            />
        </div>
    )
}
