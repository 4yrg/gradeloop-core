"use client"

import { useIdeStore, RightActivityId } from "@/store/ide/use-ide-store"
import { Button } from "@/components/ui/button"
import { MessageSquare, MessageCircleCode } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function RightActivityBar() {
    const { activeRightActivity, setActiveRightActivity } = useIdeStore()

    const renderActivityButton = (id: RightActivityId, icon: React.ReactNode, label: string) => (
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`w-12 h-12 rounded-none relative ${activeRightActivity === id ? 'text-foreground' : 'text-muted-foreground'}`}
                        onClick={() => setActiveRightActivity(id)}
                    >
                        {activeRightActivity === id && (
                            <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-primary" />
                        )}
                        {icon}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )

    return (
        <div className="w-12 flex flex-col items-center border-l bg-muted/40 py-2 justify-start shrink-0">
            <div className="flex flex-col gap-2">
                {renderActivityButton('ai', <MessageSquare className="h-6 w-6" />, "AI Assistant")}
                {renderActivityButton('annotations', <MessageCircleCode className="h-6 w-6" />, "Code Annotations")}
            </div>
        </div>
    )
}
