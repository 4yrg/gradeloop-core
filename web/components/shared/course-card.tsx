import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface BaseCourseCardProps {
    id?: string;
    name: string;
    degree: string;
    specialization: string;
    code: string;
    description: string;
    assignmentCount: number;
    href: string;
}

function BaseCourseCard({ name, degree, specialization, code, description, assignmentCount, href }: BaseCourseCardProps) {
    return (
        <Link href={href} className="block transition-transform hover:scale-[1.01] active:scale-[0.99]">
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

export function InstructorCourseCard(props: Omit<BaseCourseCardProps, "href">) {
    return <BaseCourseCard {...props} href={`/instructor/courses/${props.code}`} />;
}

export function StudentCourseCard(props: Omit<BaseCourseCardProps, "href">) {
    return <BaseCourseCard {...props} href={`/student/courses/${props.code}`} />;
}

// Keep CourseCard for backward compatibility if needed, but it should be avoided
export function CourseCard({ role = "student", ...props }: Omit<BaseCourseCardProps, "href"> & { role?: "student" | "instructor" }) {
    if (role === "instructor") return <InstructorCourseCard {...props} />;
    return <StudentCourseCard {...props} />;
}
