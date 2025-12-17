import { create } from 'zustand'

export interface File {
    name: string
    content: string
    language: string
}

interface IDEState {
    files: File[]
    activeFile: File | null
    setActiveFile: (file: File) => void
    updateFileContent: (name: string, content: string) => void
    isOutputOpen: boolean
    toggleOutput: () => void
}

export const useIDEStore = create<IDEState>((set) => ({
    files: [
        { name: "main.py", content: "print('Hello GradeLoop')", language: "python" },
        { name: "utils.py", content: "# Helper functions", language: "python" },
        { name: "README.md", content: "# Project Instructions", language: "markdown" }
    ],
    activeFile: { name: "main.py", content: "print('Hello GradeLoop')", language: "python" },
    setActiveFile: (file) => set({ activeFile: file }),
    updateFileContent: (name, content) =>
        set((state) => ({
            files: state.files.map((f) =>
                f.name === name ? { ...f, content } : f
            ),
            activeFile: state.activeFile?.name === name ? { ...state.activeFile, content } : state.activeFile
        })),
    isOutputOpen: true,
    toggleOutput: () => set((state) => ({ isOutputOpen: !state.isOutputOpen }))
}))
