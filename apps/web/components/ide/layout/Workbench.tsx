"use client"

import { useIdeStore } from "@/store/ide/use-ide-store"
import { ActivityBar } from "@/components/ide/activity-bar/ActivityBar"
import { Sidebar } from "@/components/ide/sidebar/Sidebar"
import { EditorGroup } from "@/components/ide/editor/EditorGroup"
import { Panel } from "@/components/ide/panel/Panel"
import { AIAssistant } from "@/components/ide/ai/AIAssistant"
import { StatusBar } from "@/components/ide/layout/StatusBar"
import { RightActivityBar } from "@/components/ide/activity-bar/RightActivityBar"
import { AnnotationPanel } from "@/components/ide/annotations/AnnotationPanel"

import { MenuBar } from "./MenuBar"
import { SettingsDialog } from "@/components/ide/layout/SettingsDialog"

export function Workbench() {
    const {
        sidebarVisible,
        auxiliaryBarVisible,
        panelVisible,
        sidebarWidth,
        auxiliaryBarWidth,
        isSettingsOpen,
        setSettingsOpen,
        activeRightActivity
    } = useIdeStore()

    return (
        <div className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden">
            {/* Modals */}
            <SettingsDialog open={isSettingsOpen} onOpenChange={setSettingsOpen} />

            {/* Top Menu Bar */}
            <MenuBar />

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Activity Bar (Fixed Width) */}
                <ActivityBar />

                {/* Left Sidebar */}
                {sidebarVisible && (
                    <div
                        className="border-r bg-muted/30 flex-none"
                        style={{ width: sidebarWidth || 250 }}
                    >
                        <Sidebar />
                    </div>
                )}

                {/* Center Area (Editor + Panel) */}
                <div className="flex-1 flex flex-col min-w-0 bg-background">
                    {/* Editor Area */}
                    <div className="flex-1 overflow-hidden relative">
                        <EditorGroup />
                    </div>

                    {/* Bottom Panel */}
                    {panelVisible && (
                        <div
                            className="border-t flex-none bg-background"
                            style={{ height: 200 }}
                        >
                            <Panel />
                        </div>
                    )}
                </div>

                {/* Right Panel (AI or Annotations) */}
                {auxiliaryBarVisible && (
                    <div
                        className="border-l bg-card flex-none"
                        style={{ width: auxiliaryBarWidth || 300 }}
                    >
                        {activeRightActivity === 'ai' ? <AIAssistant /> : <AnnotationPanel />}
                    </div>
                )}

                {/* Right Activity Bar */}
                <RightActivityBar />
            </div>

            {/* Status Bar (Fixed Height) */}
            <StatusBar />
        </div>
    )
}
