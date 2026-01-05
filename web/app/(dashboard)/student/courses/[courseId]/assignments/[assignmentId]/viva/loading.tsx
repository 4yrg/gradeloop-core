import { Card, CardContent } from "../../../../../../../../components/ui/card";
import { Skeleton } from "../../../../../../../../components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function VivaLoading() {
    return (
        <div className="flex flex-col gap-8 pb-20 max-w-5xl mx-auto w-full px-4 pt-6">
            <div className="flex flex-col gap-4">
                <Skeleton className="h-4 w-24" />
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>

                <div className="space-y-6">
                    <Skeleton className="h-40 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                </div>
            </div>
            <div className="flex justify-center mt-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
            </div>
        </div>
    );
}
