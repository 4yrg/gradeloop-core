import { useInstituteSetup } from "../../api/queries"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface SetupProgressTabProps {
    instituteId: string
    progress: number
}

export function SetupProgressTab({ instituteId, progress }: SetupProgressTabProps) {
    const { data: steps, isLoading } = useInstituteSetup(instituteId)

    if (isLoading) return <div>Loading setup steps...</div>

    return (
        <div className="space-y-8 max-w-2xl">
            <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                    <span>Overall Completion</span>
                    <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-muted">
                {steps?.map((step) => (
                    <div key={step.id} className="relative pl-12">
                        <div className="absolute left-0 mt-0.5">
                            {step.status === "completed" ? (
                                <CheckCircle2 className="h-10 w-10 text-primary bg-background p-1" />
                            ) : step.status === "in-progress" ? (
                                <Clock className="h-10 w-10 text-warning bg-background p-1" />
                            ) : (
                                <Circle className="h-10 w-10 text-muted-foreground bg-background p-1" />
                            )}
                        </div>
                        <div className="p-4 rounded-lg border bg-card">
                            <h4 className={cn(
                                "font-semibold",
                                step.status === "completed" && "line-through text-muted-foreground"
                            )}>
                                {step.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
