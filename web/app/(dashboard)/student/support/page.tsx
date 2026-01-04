"use client";

import {
    ExternalLink,
    HelpCircle,
    LifeBuoy,
    MessageCircle,
    Search,
    ShieldQuestion,
    WifiOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SupportPage() {
    return (
        <div className="flex flex-col gap-8 pb-20 max-w-4xl mx-auto w-full px-4">
            <div className="flex flex-col gap-4 text-center items-center">
                <div className="bg-primary/10 p-4 rounded-full mb-2">
                    <LifeBuoy className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight">Help & Support</h1>
                <p className="text-muted-foreground max-w-xl">
                    Having technical issues or need clarification? We're here to help you succeed.
                </p>
                <div className="relative w-full max-w-md mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10 h-12 shadow-lg" placeholder="Search for documentation or help topics..." />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="hover:border-primary/50 transition-all cursor-pointer group">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                            <MessageCircle className="h-5 w-5" />
                            Direct Support
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Chat with our technical support team for platform-related issues.
                        </p>
                        <Button className="w-full">Start Live Chat</Button>
                    </CardContent>
                </Card>

                <Card className="hover:border-primary/50 transition-all cursor-pointer group">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                            <ShieldQuestion className="h-5 w-5" />
                            Academic Inquiry
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Submit a question to your course instructors or teaching assistants.
                        </p>
                        <Button variant="outline" className="w-full">Contact Instructor</Button>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-bold">Frequently Asked</h2>
                <div className="grid grid-cols-1 gap-4">
                    {[
                        "How do I submit after the deadline?",
                        "What happens if my internet fails during a Viva?",
                        "Why is the auto-grader failing my code?",
                        "How do I request a time extension for special accommodations?",
                    ].map((q, i) => (
                        <div key={i} className="p-4 border rounded-xl flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer group">
                            <span className="text-sm font-medium">{q}</span>
                            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                    ))}
                </div>
            </div>

            <Alert variant="default" className="bg-amber-500/5 border-amber-500/20">
                <WifiOff className="h-5 w-5 text-amber-600" />
                <AlertTitle className="text-amber-800 font-bold">Offline Resilience</AlertTitle>
                <AlertDescription className="text-xs text-amber-700">
                    Gradeloop supports offline drafts. Your current progress in the workspace is saved locally and will sync once your connection is restored.
                </AlertDescription>
            </Alert>
        </div>
    );
}
