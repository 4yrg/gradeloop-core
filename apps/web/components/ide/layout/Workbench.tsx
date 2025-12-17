"use client"

import { useIdeStore } from "@/store/ide/use-ide-store"
import { ActivityBar } from "@/components/ide/activity-bar/ActivityBar"
import { Sidebar } from "@/components/ide/sidebar/Sidebar"
import { EditorGroup } from "@/components/ide/editor/EditorGroup"
import { Panel } from "@/components/ide/panel/Panel"
import { AIAssistant } from "@/components/ide/ai/AIAssistant"
import { StatusBar } from "@/components/ide/layout/StatusBar"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

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
        setSettingsOpen
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

                {/* Resizable Horizontally */}
                <ResizablePanelGroup direction="horizontal" className="flex-1">

                    {/* Left Sidebar */}
                    {sidebarVisible && (
                        <>
                            <ResizablePanel
                                defaultSize={20}
                                minSize={15}
                                maxSize={30}
                                className="border-r bg-muted/30"
                            >
                                <Sidebar />
                            </ResizablePanel>
                            <ResizableHandle />
                        </>
                    )}

                    {/* Editor & Panel Area */}
                    <ResizablePanel defaultSize={60}>
                        <ResizablePanelGroup direction="vertical">
                            {/* Editor Area */}
                            <ResizablePanel defaultSize={panelVisible ? 70 : 100} className="relative">
                                <EditorGroup />
                            </ResizablePanel>

                            {/* Bottom Panel */}
                            {panelVisible && (
                                <>
                                    <ResizableHandle />
                                    <ResizablePanel defaultSize={30} minSize={10}>
                                        <Panel />
                                    </ResizablePanel>
                                </>
                            )}
                        </ResizablePanelGroup>
                    </ResizablePanel>

                    {/* Right AI Assistant */}
                    {auxiliaryBarVisible && (
                        <>
                            <ResizableHandle />
                            <ResizablePanel
                                defaultSize={25}
                                minSize={20}
                                maxSize={40}
                                className="border-l bg-card"
                            >
                                <AIAssistant />
                            </ResizablePanel>

                        </>
                    )}

                </ResizablePanelGroup>
            </div>

            {/* Status Bar (Fixed Height) */}
            <StatusBar />
        </div>
    )
}
