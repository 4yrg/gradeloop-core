import { create } from 'zustand'

export interface FileNode {
    id: string
    name: string
    language: string
    content: string
    isReadOnly?: boolean
}

interface IDEState {
    files: FileNode[]
    activeFileId: string | null
    terminalOutput: string[]
    isExecuting: boolean
    isSubmitting: boolean
    activeTab: 'code' | 'test'

    setFiles: (files: FileNode[]) => void
    setActiveFile: (fileId: string) => void
    updateFileContent: (fileId: string, content: string) => void
    appendTerminalOutput: (output: string) => void
    clearTerminal: () => void
    setExecuting: (status: boolean) => void
    setSubmitting: (status: boolean) => void
    setActiveTab: (tab: 'code' | 'test') => void
}

const defaultMainJava = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, GradeLoop!");
    }
}`

export const useIDEStore = create<IDEState>((set) => ({
    files: [
        { id: '1', name: 'Main.java', language: 'java', content: defaultMainJava },
        { id: '2', name: 'README.md', language: 'markdown', content: '# Assignment Instructions\n\nImplement the sorting algorithm...', isReadOnly: true }
    ],
    activeFileId: '1',
    terminalOutput: ['$ javac Main.java', '$ java Main', 'Hello, GradeLoop!'],
    isExecuting: false,
    isSubmitting: false,
    activeTab: 'code',

    setFiles: (files) => set({ files }),
    setActiveFile: (activeFileId) => set({ activeFileId }),
    updateFileContent: (fileId, content) =>
        set((state) => ({
            files: state.files.map((f) =>
                f.id === fileId ? { ...f, content } : f
            ),
        })),
    appendTerminalOutput: (output) =>
        set((state) => ({ terminalOutput: [...state.terminalOutput, output] })),
    clearTerminal: () => set({ terminalOutput: [] }),
    setExecuting: (isExecuting) => set({ isExecuting }),
    setSubmitting: (isSubmitting) => set({ isSubmitting }),
    setActiveTab: (activeTab) => set({ activeTab }),
}))
