"use client"

import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarShortcut,
    MenubarTrigger,
} from "@/components/ui/menubar"
import { Button } from "@/components/ui/button"
import { useIdeStore } from "@/store/ide/use-ide-store"
import { Settings, FileCode, Save, FolderOpen, Play, Bug, Sidebar as SidebarIcon, PanelBottom, MessageSquare } from "lucide-react"

export function MenuBar() {
    const { setActiveActivity, togglePanel, toggleAuxiliaryBar, toggleSidebar, sidebarVisible, panelVisible, auxiliaryBarVisible } = useIdeStore()

    return (
        <div className="h-8 border-b flex items-center px-2 bg-background select-none justify-between">
            <div className="flex items-center">
                <div className="mr-4 font-bold text-sm text-primary flex items-center gap-2">
                    <FileCode className="h-4 w-4" />
                    GradeLoop IDE
                </div>

                <Menubar className="border-none shadow-none bg-transparent h-auto p-0">
                    <MenubarMenu>
                        <MenubarTrigger className="text-xs px-2 h-6 data-[state=open]:bg-accent cursor-pointer">File</MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem>
                                New File <MenubarShortcut>⌘N</MenubarShortcut>
                            </MenubarItem>
                            <MenubarItem>
                                Open File... <MenubarShortcut>⌘O</MenubarShortcut>
                            </MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem>
                                Save <MenubarShortcut>⌘S</MenubarShortcut>
                            </MenubarItem>
                            <MenubarItem>
                                Save As... <MenubarShortcut>⇧⌘S</MenubarShortcut>
                            </MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem>
                                Exit
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>

                    <MenubarMenu>
                        <MenubarTrigger className="text-xs px-2 h-6 data-[state=open]:bg-accent cursor-pointer">Edit</MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem>
                                Undo <MenubarShortcut>⌘Z</MenubarShortcut>
                            </MenubarItem>
                            <MenubarItem>
                                Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
                            </MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem>Cut <MenubarShortcut>⌘X</MenubarShortcut></MenubarItem>
                            <MenubarItem>Copy <MenubarShortcut>⌘C</MenubarShortcut></MenubarItem>
                            <MenubarItem>Paste <MenubarShortcut>⌘V</MenubarShortcut></MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>

                    <MenubarMenu>
                        <MenubarTrigger className="text-xs px-2 h-6 data-[state=open]:bg-accent cursor-pointer">View</MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem onClick={() => setActiveActivity('explorer')}>
                                Explorer <MenubarShortcut>⇧⌘E</MenubarShortcut>
                            </MenubarItem>
                            <MenubarItem onClick={() => setActiveActivity('search')}>
                                Search <MenubarShortcut>⇧⌘F</MenubarShortcut>
                            </MenubarItem>
                            <MenubarItem onClick={() => setActiveActivity('git')}>
                                Source Control <MenubarShortcut>⌃⇧G</MenubarShortcut>
                            </MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem onClick={togglePanel}>
                                Toggle Panel <MenubarShortcut>⌘J</MenubarShortcut>
                            </MenubarItem>
                            <MenubarItem onClick={toggleAuxiliaryBar}>
                                Toggle AI Assistant <MenubarShortcut>⌘B</MenubarShortcut>
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>

                    <MenubarMenu>
                        <MenubarTrigger className="text-xs px-2 h-6 data-[state=open]:bg-accent cursor-pointer">Run</MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem>
                                <Play className="h-3 w-3 mr-2" /> Start Debugging <MenubarShortcut>F5</MenubarShortcut>
                            </MenubarItem>
                            <MenubarItem>
                                <Bug className="h-3 w-3 mr-2" /> Run Without Debugging <MenubarShortcut>⌃F5</MenubarShortcut>
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>

                    <MenubarMenu>
                        <MenubarTrigger className="text-xs px-2 h-6 data-[state=open]:bg-accent cursor-pointer">Help</MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem>Welcome</MenubarItem>
                            <MenubarItem>Documentation</MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem>About GradeLoop</MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                </Menubar>
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={toggleSidebar}
                    className={`p-1.5 rounded hover:bg-accent ${sidebarVisible ? 'bg-accent/50 text-foreground' : 'text-muted-foreground'}`}
                    title="Toggle Primary Side Bar"
                >
                    <SidebarIcon className="h-4 w-4" />
                </button>
                <button
                    onClick={togglePanel}
                    className={`p-1.5 rounded hover:bg-accent ${panelVisible ? 'bg-accent/50 text-foreground' : 'text-muted-foreground'}`}
                    title="Toggle Panel"
                >
                    <PanelBottom className="h-4 w-4" />
                </button>
                <button
                    onClick={toggleAuxiliaryBar}
                    className={`p-1.5 rounded hover:bg-accent ${auxiliaryBarVisible ? 'bg-accent/50 text-foreground' : 'text-muted-foreground'}`}
                    title="Toggle Secondary Side Bar"
                >
                    <MessageSquare className="h-4 w-4" />
                </button>
            </div>

            <div className="flex items-center gap-2 pl-2 border-l ml-1">
                <Button
                    size="sm"
                    className="h-6 text-xs px-3 bg-green-600 hover:bg-green-700 text-white border-none"
                    onClick={() => useIdeStore.getState().setActivePopup('submission')}
                >
                    Submit
                </Button>
            </div>
        </div>
    )
}
