import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CourseCardProps {
    title: string
    code: string
    description: string
    assignmentsCount: number
}

export function CourseCard({ title, code, description, assignmentsCount }: CourseCardProps) {
    return (
        <Card
            className={cn(
                "flex flex-col h-full transition-shadow hover:shadow-md cursor-pointer border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50",
            )}
        >
            <CardHeader className="pb-3 space-y-1">
                <CardTitle className="text-lg font-medium leading-none tracking-tight">
                    {title}
                </CardTitle>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                    {code}
                </div>
            </CardHeader>
            <CardContent className="flex-1 pb-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                    {description}
                </p>
            </CardContent>
            <div className="mt-auto">
                <div className="bg-zinc-600 dark:bg-zinc-700 px-4 py-1.5 text-white text-xs font-medium">
                    {assignmentsCount} assignments
                </div>
            </div>
        </Card>
    )
}

export function CreateCourseCard({ onClick }: { onClick?: () => void }) {
    return (
        <div
            role="button"
            onClick={onClick}
            className="flex flex-col items-center justify-center h-full min-h-[200px] border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group"
        >
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                + Create a new course
            </span>
        </div>
    )
}
