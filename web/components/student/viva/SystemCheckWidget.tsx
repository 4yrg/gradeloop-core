"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Mic, Video, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";

export function SystemCheckWidget() {
    const [hasMic, setHasMic] = useState<boolean | null>(null);
    const [hasCam, setHasCam] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    const checkPermissions = async () => {
        setIsChecking(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            setHasMic(true);
            setHasCam(true);
            // Stop tracks to release devices
            stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            console.error("Permission check failed", err);
            setHasMic(false);
            setHasCam(false);
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-medium">System Readiness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center border">
                            <Mic className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">Microphone</span>
                    </div>
                    {hasMic === true && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {hasMic === false && <XCircle className="h-5 w-5 text-red-500" />}
                    {hasMic === null && <span className="text-xs text-muted-foreground">Not checked</span>}
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center border">
                            <Video className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">Camera</span>
                    </div>
                    {hasCam === true && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {hasCam === false && <XCircle className="h-5 w-5 text-red-500" />}
                    {hasCam === null && <span className="text-xs text-muted-foreground">Not checked</span>}
                </div>

                <Button
                    variant="outline"
                    className="w-full"
                    onClick={checkPermissions}
                    disabled={isChecking}
                >
                    {isChecking ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Checking...
                        </>
                    ) : (
                        "Check Permissions"
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
