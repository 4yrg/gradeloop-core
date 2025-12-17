"use client"

import { useIdeStore } from "@/store/ide/use-ide-store"
import { GitBranch, AlertCircle, XCircle, Check } from "lucide-react"

export function StatusBar() {
    const { role } = useIdeStore()

    return (
        <div className="h-6 bg-primary text-primary-foreground text-xs flex items-center px-3 justify-between select-none">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 hover:bg-primary/80 px-1 rounded cursor-pointer">
                    <GitBranch className="h-3 w-3" />
                    <span>main</span>
                </div>
                <div className="flex items-center gap-1 hover:bg-primary/80 px-1 rounded cursor-pointer">
                    <XCircle className="h-3 w-3" />
                    <span>0</span>
                    <AlertCircle className="h-3 w-3 ml-1" />
                    <span>0</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                    <span>Ln 12, Col 45</span>
                </div>
                <div>UTF-8</div>
                <div>Python</div>
                <div className="font-semibold uppercase opacity-80">{role} Mode</div>
                <div className="hover:bg-primary/80 px-1 rounded cursor-pointer">
                    <Check className="h-3 w-3" />
                </div>
            </div>
        </div>
    )
}
