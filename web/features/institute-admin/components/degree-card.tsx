import { Degree } from "../types";
import { cn } from "../../../lib/utils";

interface DegreeCardProps {
    degree: Degree;
    onClick: (degree: Degree) => void;
}

export function DegreeCard({ degree, onClick }: DegreeCardProps) {
    return (
        <div
            onClick={() => onClick(degree)}
            className={cn(
                "group relative flex flex-col justify-between h-48",
                "bg-zinc-200 cursor-pointer overflow-hidden",
                "hover:ring-2 hover:ring-primary transition-all",
                "rounded-sm" // Very slight rounding or none as per sharp edge request
            )}
        >
            <div className="p-5 space-y-3">
                <h3 className="text-lg font-semibold tracking-tight text-zinc-900 line-clamp-2 leading-tight">
                    {degree.name}
                </h3>
                <div className="space-y-1">
                    {degree.code && (
                        <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                            {degree.code}
                        </p>
                    )}
                    {degree.description && (
                        <p className="text-xs text-zinc-600 line-clamp-2">
                            {degree.description}
                        </p>
                    )}
                </div>
            </div>

            <div className="bg-zinc-500 text-white px-5 py-2 text-xs font-medium mt-auto">
                {degree.requiredCredits} Credits
            </div>
        </div>
    );
}
