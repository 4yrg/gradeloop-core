import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CourseCardProps {
    id?: string;
    name: string;
    degree: string;
    specialization: string;
    code: string;
    description: string;
    assignmentCount: number;
}

export function CourseCard({ id, name, degree, specialization, code, description, assignmentCount }: CourseCardProps) {
    return (
        <Link href={`/instructor/courses/${code}`} className="block transition-transform hover:scale-[1.01] active:scale-[0.99]">
            <Card className="overflow-hidden border shadow-sm h-full">
                <CardHeader className="p-5 pb-2">
                    <CardTitle className="text-lg font-semibold">{name}</CardTitle>
                    <div className="flex gap-2 text-[10px] text-muted-foreground uppercase tracking-wider">
                        <span>{degree}</span>
                        <span>{specialization}</span>
                        <span>{code}</span>
                    </div>
                </CardHeader>
                <CardContent className="p-5 pt-2">
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                        {description}
                    </p>
                </CardContent>
                <div className="bg-muted p-2 px-5 border-t">
                    <p className="text-xs font-medium text-muted-foreground">
                        {assignmentCount} assignments
                    </p>
                </div>
            </Card>
        </Link>
    );
}
