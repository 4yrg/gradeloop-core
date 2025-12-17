"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings as SettingsIcon, User, Bell, Sliders } from "lucide-react"

export default function SettingsPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your preferences and account</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Profile
                        </CardTitle>
                        <CardDescription>Manage your personal information</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Update your profile details and preferences</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Notifications
                        </CardTitle>
                        <CardDescription>Configure notification preferences</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Choose how you receive updates</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sliders className="h-5 w-5" />
                            Grading Defaults
                        </CardTitle>
                        <CardDescription>Set default grading preferences</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Configure rubric and grading defaults</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Settings Panel</CardTitle>
                    <CardDescription>Full settings interface coming soon</CardDescription>
                </CardHeader>
                <CardContent className="py-12 text-center text-muted-foreground">
                    <SettingsIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>Settings implementation in progress</p>
                    <p className="text-sm mt-2">Features: Profile management, preferences, security</p>
                </CardContent>
            </Card>
        </div>
    )
}
