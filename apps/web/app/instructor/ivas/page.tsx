"use client"

import { ComingSoon } from "@/components/placeholders/coming-soon"
import { InstructorSidebar } from "@/components/sidebar/instructor-sidebar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export default function IVASPage() {
    const features = [
        "Real-time webcam proctoring integration",
        "Gaze tracking & attention analysis",
        "Identity verification via biometric auth",
        "Automated viva voice assistant",
        "Session playback & flagging system"
    ]

    return (
        <div className="flex min-h-screen">
            <div className="hidden w-64 md:block">
                <InstructorSidebar className="fixed inset-y-0 w-64" />
            </div>

            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden absolute top-4 left-4 z-50">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 border-r-0 w-64">
                    <InstructorSidebar />
                </SheetContent>
            </Sheet>

            <main className="flex-1 md:ml-64 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-center">
                <ComingSoon
                    title="IVAS"
                    moduleName="Intelligent Verification & Assessment System"
                    description="IVAS is an advanced AI-driven module designed to ensure examination integrity through multi-modal monitoring. It will provide real-time proctoring and automated viva capabilities."
                    features={features}
                    backLink="/instructor/dashboard"
                />
            </main>
        </div>
    )
}
