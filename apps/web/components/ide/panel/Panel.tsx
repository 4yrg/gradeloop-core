"use client"

import { useIdeStore, PanelTabId } from "@/store/ide/use-ide-store"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export function Panel() {
    const { activePanelTab, setActivePanelTab, togglePanel } = useIdeStore()

    const Tab = ({ id, label }: { id: PanelTabId, label: string }) => (
        <button
            onClick={() => setActivePanelTab(id)}
            className={cn(
                "px-3 py-2 text-xs uppercase tracking-wide border-b-2 transition-colors",
                activePanelTab === id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
        >
            {label}
        </button>
    )

    return (
        <div className="h-full flex flex-col bg-background border-t">
            <div className="flex items-center justify-between px-2 bg-muted/20 border-b">
                <div className="flex">
                    <Tab id="terminal" label="Terminal" />
                    <Tab id="problems" label="Problems" />
                    <Tab id="output" label="Output" />
                    <Tab id="test-results" label="Test Results" />
                </div>
                <button onClick={togglePanel} className="p-1 hover:bg-muted-foreground/20 rounded">
                    <X className="h-3 w-3 text-muted-foreground" />
                </button>
            </div>

            <div className="flex-1 overflow-auto p-4 font-mono text-sm">
                {activePanelTab === 'terminal' && (
                    <div className="space-y-1">
                        <div className="text-muted-foreground">Microsoft Windows [Version 10.0.19045.3693]</div>
                        <div className="text-muted-foreground">(c) Microsoft Corporation. All rights reserved.</div>
                        <br />
                        <div className="flex gap-2">
                            <span className="text-green-500">➜</span>
                            <span className="text-blue-500">gradeloop-project</span>
                            <span>python main.py</span>
                        </div>
                        <div>Hello World</div>
                        <div className="flex gap-2">
                            <span className="text-green-500">➜</span>
                            <span className="text-blue-500">gradeloop-project</span>
                            <span className="animate-pulse">_</span>
                        </div>
                    </div>
                )}

                {activePanelTab === 'problems' && (
                    <div className="text-muted-foreground">
                        No problems have been detected in the workspace.
                    </div>
                )}

                {activePanelTab === 'output' && (
                    <div className="text-muted-foreground">
                        [Info] Language Server starting...<br />
                        [Info] Python extension loaded.
                    </div>
                )}
            </div>
        </div>
    )
}
