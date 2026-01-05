'use client';

import {
    PlayCircle,
    Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../../../../../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../../../../../../../../components/ui/alert";

export default function SessionPlaybackPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-15rem)] gap-6 text-center max-w-2xl mx-auto">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <PlayCircle className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Session Playback</h2>
                <p className="text-muted-foreground">
                    A visual timeline of student code edits, chat interactions, and test runs.
                    This feature is currently under active development.
                </p>
            </div>

            <Card className="w-full bg-muted/20 border-dashed">
                <CardHeader>
                    <CardTitle className="text-sm">Future Hooks</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4 text-xs font-medium text-muted-foreground">
                    <div className="p-3 rounded border bg-background">Real-time Code Diff</div>
                    <div className="p-3 rounded border bg-background">Chat Context Pins</div>
                    <div className="p-3 rounded border bg-background">Execution Markers</div>
                </CardContent>
            </Card>

            <Alert className="text-left mt-4 border-primary/20 bg-primary/5">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">Coming Soon</AlertTitle>
                <AlertDescription>
                    Integration with common IDEs (VS Code, IntelliJ) via Gradeloop Extension for full development lifecycle tracing.
                </AlertDescription>
            </Alert>
        </div>
    );
}
