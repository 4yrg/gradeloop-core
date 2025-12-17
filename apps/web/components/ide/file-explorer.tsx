"use client"

import { FileNode } from "@/store/ide.store"
import { cn } from "@/lib/utils"
import { FileCode, FileText, Folder, Check, Loader2 } from "lucide-react"

interface FileExplorerProps {
    files: FileNode[]
    activeFileId: string | null
    onFileSelect: (fileId: string) => void
}

export function FileExplorer({ files, activeFileId, onFileSelect }: FileExplorerProps) {
    return (
        <div className="h-full bg-slate-50 dark:bg-slate-900 border-r flex flex-col">
            <div className="p-3 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Explorer
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                <div className="flex items-center space-x-2 px-2 py-1.5 text-sm text-foreground mb-1">
                    <Folder className="h-4 w-4 text-blue-500 fill-blue-500/20" />
                    <span className="font-medium">src</span>
                </div>
                <div className="pl-4 space-y-1">
                    {files.map((file) => (
                        <button
                            key={file.id}
                            onClick={() => onFileSelect(file.id)}
                            className={cn(
                                "flex w-full items-center space-x-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
                                activeFileId === file.id && "bg-muted font-medium text-primary"
                            )}
                        >
                            {file.language === 'java' ? (
                                <FileCode className="h-4 w-4 text-orange-500" />
                            ) : (
                                <FileText className="h-4 w-4 text-gray-500" />
                            )}
                            <span>{file.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
