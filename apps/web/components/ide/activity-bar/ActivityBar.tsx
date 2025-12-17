"use client"

import { useIdeStore, ActivityId } from "@/store/ide/use-ide-store"
import { Button } from "@/components/ui/button"
import {
    Files,
    Search,
    GitGraph,
    Play,
    Settings,
    Blocks,
    UserCircle
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function ActivityBar() {
    const { activeActivity, setActiveActivity, setSettingsOpen } = useIdeStore()

    const renderActivityButton = (id: ActivityId, icon: React.ReactNode, label: string) => (
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`w-12 h-12 rounded-none relative ${activeActivity === id ? 'text-foreground' : 'text-muted-foreground'}`}
                        onClick={() => setActiveActivity(id)}
                    >
                        {activeActivity === id && (
                            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary" />
                        )}
                        {icon}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )

    return (
        <div className="w-12 flex flex-col items-center border-r bg-muted/40 py-2 justify-between shrink-0">
            <div className="flex flex-col gap-2">
                {renderActivityButton('explorer', <Files className="h-6 w-6" />, "Explorer")}
                {renderActivityButton('search', <Search className="h-6 w-6" />, "Search")}
                {renderActivityButton('git', <GitGraph className="h-6 w-6" />, "Source Control")}
                {renderActivityButton('run', <Play className="h-6 w-6" />, "Run and Debug")}
                {renderActivityButton('extensions', <Blocks className="h-6 w-6" />, "Extensions")}
            </div>
            <div className="flex flex-col gap-2">
                <TooltipProvider>
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-12 h-12 rounded-none text-muted-foreground">
                                <UserCircle className="h-6 w-6" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Accounts</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                {/* Special handling for Settings to open modal */}
                <TooltipProvider>
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`w-12 h-12 rounded-none relative text-muted-foreground`}
                                onClick={() => setSettingsOpen(true)}
                            >
                                <Settings className="h-6 w-6" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Settings</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    )
}
