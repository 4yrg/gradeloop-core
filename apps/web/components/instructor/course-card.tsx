import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CourseCardProps {
    name: string;
    degree: string;
    specialization: string;
    code: string;
    description: string;
    assignmentCount: number;
}

export function CourseCard({ name, degree, specialization, code, description, assignmentCount }: CourseCardProps) {
    return (
        <Card className="overflow-hidden border shadow-sm">
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
    );
}
