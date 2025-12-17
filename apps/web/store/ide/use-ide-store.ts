import { create } from 'zustand'

export type ActivityId = 'explorer' | 'search' | 'git' | 'extensions' | 'settings' | 'run'
export type RightActivityId = 'ai' | 'annotations'
export type PanelTabId = 'terminal' | 'output' | 'problems' | 'test-results'
export type Role = 'student' | 'instructor' | 'admin'

interface File {
    id: string
    name: string
    language: string
    content: string
    isReadOnly?: boolean
}

export type PopupType = 'annotation' | 'ask-ai'

interface SelectionData {
    code: string
    line: number
    endLine?: number
    fileId: string
}

interface IdeState {
    // Workbench Layout
    sidebarVisible: boolean
    sidebarWidth: number
    auxiliaryBarVisible: boolean // AI Assistant
    auxiliaryBarWidth: number
    panelVisible: boolean
    panelHeight: number

    // Modals & Popups
    isSettingsOpen: boolean
    activePopup: PopupType | null
    activeSelection: SelectionData | null

    // Activity Bar
    activeActivity: ActivityId | null
    activeRightActivity: RightActivityId | null

    // Editor
    files: File[]
    activeFileId: string | null
    openFiles: string[] // List of IDs

    // Panel
    activePanelTab: PanelTabId

    // User Context
    role: Role

    // Actions
    toggleSidebar: () => void
    setSidebarVisible: (visible: boolean) => void
    toggleAuxiliaryBar: () => void
    togglePanel: () => void
    setSettingsOpen: (open: boolean) => void
    setActiveActivity: (id: ActivityId) => void
    setActiveRightActivity: (id: RightActivityId) => void
    setActiveFile: (id: string) => void
    openFile: (file: File) => void
    closeFile: (id: string) => void
    setActivePanelTab: (id: PanelTabId) => void
    setRole: (role: Role) => void

    updateFileContent: (id: string, content: string) => void
}

const DEFAULT_FILES: File[] = [
    { id: '1', name: 'main.py', language: 'python', content: "print('Hello World')\n\n# Calculate Fibonacci\ndef fib(n):\n    if n <= 1: return n\n    return fib(n-1) + fib(n-2)" },
    { id: '2', name: 'utils.py', language: 'python', content: "# Utility functions\n\ndef format_output(data):\n    return str(data)" },
    { id: '3', name: 'README.md', language: 'markdown', content: "# Assignment 1\n\nImplement the Fibonacci sequence." }
]

export const useIdeStore = create<IdeState>((set, get) => ({
    // Initial State
    sidebarVisible: true,
    sidebarWidth: 250,
    auxiliaryBarVisible: true,
    auxiliaryBarWidth: 300,
    panelVisible: true,
    panelHeight: 200,

    activeActivity: 'explorer',
    activeRightActivity: 'ai',

    files: DEFAULT_FILES,
    activeFileId: '1',
    openFiles: ['1', '2'],

    activePanelTab: 'terminal',

    role: 'student',



    isSettingsOpen: false,
    activePopup: null,
    activeSelection: null,

    // Actions
    toggleSidebar: () => set(state => ({ sidebarVisible: !state.sidebarVisible })),
    setSidebarVisible: (visible) => set({ sidebarVisible: visible }),

    toggleAuxiliaryBar: () => set(state => ({ auxiliaryBarVisible: !state.auxiliaryBarVisible })),

    togglePanel: () => set(state => ({ panelVisible: !state.panelVisible })),

    setSettingsOpen: (open) => set({ isSettingsOpen: open }),

    setActiveActivity: (id) => {
        const { activeActivity, sidebarVisible } = get()
        if (activeActivity === id && sidebarVisible) {
            set({ sidebarVisible: false }) // Toggle off
        } else {
            set({ activeActivity: id, sidebarVisible: true })
        }
    },

    setActiveRightActivity: (id) => {
        const { activeRightActivity, auxiliaryBarVisible } = get()
        if (activeRightActivity === id && auxiliaryBarVisible) {
            set({ auxiliaryBarVisible: false })
        } else {
            set({ activeRightActivity: id, auxiliaryBarVisible: true })
        }
    },

    setActivePopup: (popup: PopupType | null) => set({ activePopup: popup }),
    setActiveSelection: (selection: SelectionData | null) => set({ activeSelection: selection }),

    setActiveFile: (id) => set({ activeFileId: id }),

    openFile: (file) => set(state => {
        const isOpen = state.openFiles.includes(file.id)
        return {
            openFiles: isOpen ? state.openFiles : [...state.openFiles, file.id],
            activeFileId: file.id
        }
    }),

    closeFile: (id) => set(state => {
        const newOpen = state.openFiles.filter(fid => fid !== id)
        // If closing active file, switch to another
        let newActive = state.activeFileId
        if (state.activeFileId === id) {
            newActive = newOpen.length > 0 ? newOpen[newOpen.length - 1] : null
        }
        return {
            openFiles: newOpen,
            activeFileId: newActive
        }
    }),

    setActivePanelTab: (id) => set({ activePanelTab: id }),

    setRole: (role) => set({ role }),

    updateFileContent: (id, content) => set(state => ({
        files: state.files.map(f => f.id === id ? { ...f, content } : f)
    }))
}))
