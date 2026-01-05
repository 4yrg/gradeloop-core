'use client';

import {
    Settings,
    Calendar,
    Eye,
    Weight,
    Download,
    History,
    Save,
    Trash2,
    Lock,
    Globe
} from "lucide-react";
import { Button } from "../../../../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../../../../../components/ui/card";
import { Badge } from "../../../../../../../../components/ui/badge";
import { Input } from "../../../../../../../../components/ui/input";
import { Label } from "../../../../../../../../components/ui/label";
import { Switch } from "../../../../../../../../components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "../../../../../../../../components/ui/select";
import { Separator } from "../../../../../../../../components/ui/separator";

export default function SettingsPage() {
    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Assignment Settings</h2>
                    <p className="text-muted-foreground">Manage deadlines, visibility, and grading configuration.</p>
                </div>
                <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Save All Changes
                </Button>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            Schedule & Deadlines
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Publish Date</Label>
                                <Input type="datetime-local" defaultValue="2025-10-01T08:00" />
                            </div>
                            <div className="space-y-2">
                                <Label>Soft Deadline</Label>
                                <Input type="datetime-local" defaultValue="2025-10-20T23:59" />
                            </div>
                            <div className="space-y-2">
                                <Label>Final Deadline</Label>
                                <Input type="datetime-local" defaultValue="2025-10-25T23:59" />
                            </div>
                            <div className="space-y-2">
                                <Label>Late Submission Grace (Min)</Label>
                                <Input type="number" defaultValue="15" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                            <Eye className="h-4 w-4" />
                            Visibility & Access
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Draft Mode</Label>
                                <p className="text-sm text-muted-foreground">Assignment is hidden from all students.</p>
                            </div>
                            <Switch />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Anonymous Grading</Label>
                                <p className="text-sm text-muted-foreground">Hide student names during the grading process.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">IP Whitelisting</Label>
                                <p className="text-sm text-muted-foreground">Only allow submissions from campus network.</p>
                            </div>
                            <Switch />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                            <Weight className="h-4 w-4" />
                            Grading Weights
                        </CardTitle>
                        <CardDescription>Adjust how different components contribute to the final 100%.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Autograder (%)</Label>
                                <Input type="number" defaultValue="60" />
                            </div>
                            <div className="space-y-2">
                                <Label>Viva Voce (%)</Label>
                                <Input type="number" defaultValue="30" />
                            </div>
                            <div className="space-y-2">
                                <Label>Manual Review (%)</Label>
                                <Input type="number" defaultValue="10" />
                            </div>
                        </div>
                        <div className="p-3 rounded bg-muted/30 flex items-center justify-between">
                            <span className="text-sm font-bold">Total Weight</span>
                            <Badge variant="outline" className="bg-green-500/5 text-green-500 border-green-500/20">100% Correct</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-destructive/20 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            Danger Zone
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <p className="text-sm font-bold">Delete Assignment</p>
                            <p className="text-xs text-muted-foreground">This action is irreversible and deletes all submission data.</p>
                        </div>
                        <Button variant="destructive" size="sm">Archive & Delete</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
