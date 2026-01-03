import { ReactNode } from "react";

interface RosterSectionProps {
    title: string;
    description?: string;
    children: ReactNode;
    count?: number;
}

export function RosterSection({ title, description, children, count }: RosterSectionProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">{title}</h2>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </div>
                {count !== undefined && (
                    <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {count}
                    </span>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {children}
            </div>
        </div>
    );
}
