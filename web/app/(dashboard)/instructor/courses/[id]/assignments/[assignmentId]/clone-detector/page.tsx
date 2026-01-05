'use client';

import {
    Copy,
    Save,
    AlertTriangle,
    BarChart,
    Settings,
    History
} from "lucide-react";
import { Button } from "../../../../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../../../../../components/ui/card";
import { Label } from "../../../../../../../../components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "../../../../../../../../components/ui/select";
import { Switch } from "../../../../../../../../components/ui/switch";
import { Slider } from "../../../../../../../../components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "../../../../../../../../components/ui/alert";

export default function CloneDetectorPage() {
    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Clone Detector</h2>
                    <p className="text-muted-foreground">Detect code plagiarism and structural similarities.</p>
                </div>
                <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Save Rules
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="md:col-span-2 text-primary-foreground bg-primary border-none shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart className="h-5 w-5" />
                            Clone Detection Intelligence
                        </CardTitle>
                        <CardDescription className="text-primary-foreground/70">
                            Our engine detects 4 types of code clones, from exact copies to structural refactors.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Type 1", desc: "Exact match" },
                            { label: "Type 2", desc: "Renamed variables" },
                            { label: "Type 3", desc: "Added/Removed lines" },
                            { label: "Type 4", desc: "Structural change" },
                        ].map((type) => (
                            <div key={type.label} className="p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                                <p className="font-bold">{type.label}</p>
                                <p className="text-[10px] opacity-70">{type.desc}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Similarity Thresholds
                        </CardTitle>
                        <CardDescription>Adjust sensitivity for flag generation.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Label>Similarity Threshold (%)</Label>
                                <span className="text-sm font-bold">75%</span>
                            </div>
                            <Slider defaultValue={[75]} max={100} step={5} />
                            <p className="text-[10px] text-muted-foreground">Submissions above this threshold will be flagged.</p>
                        </div>
                        <div className="space-y-3">
                            <Label>Minimum Token Match</Label>
                            <Select defaultValue="50">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="20">20 tokens (Fine-grained)</SelectItem>
                                    <SelectItem value="50">50 tokens (Balanced)</SelectItem>
                                    <SelectItem value="100">100 tokens (High-level)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Detection Scope
                        </CardTitle>
                        <CardDescription>Define the comparison dataset.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Intra-Batch Detection</Label>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Cross-Semester Check</Label>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Public Repository Sync</Label>
                            <Switch />
                        </div>
                        <div className="space-y-2 pt-2 border-t">
                            <Label>Detection Schedule</Label>
                            <Select defaultValue="on-submission">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="on-submission">Immediate (On submission)</SelectItem>
                                    <SelectItem value="on-deadline">After deadline only</SelectItem>
                                    <SelectItem value="manual">Manual trigger only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                    Enabling high-sensitivity structural detection (Type 4) may increase false positives.
                </AlertDescription>
            </Alert>
        </div>
    );
}
