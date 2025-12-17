"use client"

import { useIdeStore } from "@/store/ide/use-ide-store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronRight, ChevronDown, File, Search as SearchIcon, MoreHorizontal, GitBranch, Check, Download, Cloud, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function Sidebar() {
    const { activeActivity, files, activeFileId, openFile } = useIdeStore()
    const [expanded, setExpanded] = useState(true)

    // EXPLORER VIEW
    if (activeActivity === 'explorer') {
        return (
            <div className="flex flex-col h-full bg-muted/20">
                <div className="h-9 px-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0 select-none">
                    <span>Explorer</span>
                    <MoreHorizontal className="h-4 w-4 cursor-pointer hover:text-foreground" />
                </div>
                <div className="px-2 pb-2">
                    <button
                        className="flex items-center gap-1 text-xs font-bold text-foreground w-full py-1 hover:bg-accent/50 rounded select-none"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        <span>PROJECT-ROOT</span>
                    </button>
                </div>
                {expanded && (
                    <ScrollArea className="flex-1">
                        <div className="px-2 flex flex-col gap-0.5">
                            {files.map(file => (
                                <button
                                    key={file.id}
                                    onClick={() => openFile(file)}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-1 text-sm rounded-sm w-full text-left transition-colors select-none",
                                        activeFileId === file.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                    )}
                                >
                                    <File className="h-3.5 w-3.5" />
                                    <span>{file.name}</span>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </div>
        )
    }

    // SEARCH VIEW
    if (activeActivity === 'search') {
        return (
            <div className="flex flex-col h-full bg-muted/20 p-4 gap-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">Search</span>
                <div className="relative">
                    <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search" className="pl-8 h-8 text-sm" />
                </div>
                <div className="text-sm text-muted-foreground text-center mt-4 select-none">
                    No results found.
                </div>
            </div>
        )
    }

    // SOURCE CONTROL (GIT) VIEW
    if (activeActivity === 'git') {
        return (
            <div className="flex flex-col h-full bg-muted/20">
                <div className="h-9 px-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0 select-none">
                    <span>Source Control</span>
                    <div className="flex gap-2">
                        <GitBranch className="h-4 w-4 cursor-pointer hover:text-foreground" />
                        <RefreshCw className="h-4 w-4 cursor-pointer hover:text-foreground" />
                        <MoreHorizontal className="h-4 w-4 cursor-pointer hover:text-foreground" />
                    </div>
                </div>
                <div className="p-4 space-y-4">
                    <div className="flex gap-2">
                        <Input placeholder="Message (⌘Enter to commit)" className="h-8 text-sm" />
                        <Button size="sm" className="h-8">Commit</Button>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase">
                            <span>Changes</span>
                            <Badge variant="secondary" className="text-[10px] h-4 px-1">2</Badge>
                        </div>
                        <div className="space-y-1">
                            <button className="flex items-center gap-2 w-full text-sm text-left hover:bg-accent/50 px-2 py-1 rounded text-yellow-500">
                                <span className="font-mono font-bold">M</span>
                                <span className="text-foreground">main.py</span>
                                <span className="ml-auto text-xs text-muted-foreground">src</span>
                            </button>
                            <button className="flex items-center gap-2 w-full text-sm text-left hover:bg-accent/50 px-2 py-1 rounded text-green-500">
                                <span className="font-mono font-bold">U</span>
                                <span className="text-foreground">utils.py</span>
                                <span className="ml-auto text-xs text-muted-foreground">src</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // EXTENSIONS VIEW
    if (activeActivity === 'extensions') {
        return (
            <div className="flex flex-col h-full bg-muted/20">
                <div className="h-9 px-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0 select-none">
                    <span>Extensions</span>
                    <MoreHorizontal className="h-4 w-4 cursor-pointer hover:text-foreground" />
                </div>
                <div className="px-4 py-2">
                    <Input placeholder="Search Extensions in Marketplace" className="h-8 text-sm" />
                </div>
                <ScrollArea className="flex-1">
                    <div className="px-2 py-2 space-y-4">
                        <div className="px-2 text-xs font-semibold text-muted-foreground uppercase">Installed</div>
                        {[
                            { name: "Python", desc: "IntelliSense, linting...", version: "v2023.1.0", author: "Microsoft" },
                            { name: "Pylance", desc: "Performant Python support", version: "v2023.1.0", author: "Microsoft" },
                        ].map(ext => (
                            <div key={ext.name} className="flex gap-3 px-2 py-2 hover:bg-accent/50 rounded cursor-pointer group">
                                <div className="h-8 w-8 bg-blue-500/20 text-blue-500 flex items-center justify-center rounded shrink-0">
                                    <Cloud className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div className="font-semibold text-sm truncate">{ext.name}</div>
                                        <div className="text-[10px] bg-muted px-1 rounded text-muted-foreground">Local</div>
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">{ext.desc}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-foreground">{ext.author}</span>
                                        <Check className="h-3 w-3 text-green-500" />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="px-2 text-xs font-semibold text-muted-foreground uppercase pt-2">Recommended</div>
                        {[
                            { name: "Prettier", desc: "Code formatted", author: "Prettier" },
                            { name: "Docker", desc: "Container support", author: "Microsoft" },
                        ].map(ext => (
                            <div key={ext.name} className="flex gap-3 px-2 py-2 hover:bg-accent/50 rounded cursor-pointer group">
                                <div className="h-8 w-8 bg-muted flex items-center justify-center rounded shrink-0">
                                    <Cloud className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div className="font-semibold text-sm truncate">{ext.name}</div>
                                        <Button size="sm" variant="secondary" className="h-5 text-[10px] px-2">Install</Button>
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">{ext.desc}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-muted-foreground">{ext.author}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        )
    }

    return (
        <div className="h-full flex items-center justify-center text-muted-foreground text-sm select-none">
            {activeActivity} view not implemented.
        </div>
    )
}
