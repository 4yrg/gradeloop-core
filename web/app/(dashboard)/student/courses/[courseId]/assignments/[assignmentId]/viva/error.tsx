"use client";

import { useEffect } from "react";
import { Button } from "../../../../../../../../components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../components/ui/card";

export default function VivaError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-[50vh] px-4">
            <Card className="w-full max-w-md border-destructive/20 bg-destructive/5">
                <CardHeader className="text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="text-destructive">Viva System Error</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                        We encountered an issue while loading the evaluation system. This might be due to a temporary connection timeout.
                    </p>
                    <p className="text-xs font-mono bg-black/5 p-2 rounded text-left overflow-auto max-h-24">
                        {error.message || "Unknown error occurred"}
                    </p>
                    <Button onClick={() => reset()} className="w-full">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
