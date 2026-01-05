'use client';

import {
    Cpu,
    Save,
    AlertCircle,
    Play,
    Terminal,
    Settings
} from "lucide-react";
import { Button } from "../../../../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../../../../../components/ui/card";
import { Input } from "../../../../../../../../components/ui/input";
import { Label } from "../../../../../../../../components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "../../../../../../../../components/ui/select";
import { Switch } from "../../../../../../../../components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "../../../../../../../../components/ui/alert";
import { Slider } from "../../../../../../../../components/ui/slider";

export default function AutograderPage() {
    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Autograder Configuration</h2>
                    <p className="text-muted-foreground">Manage execution environment and grading logic.</p>
                </div>
                <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                </Button>
            </div>

            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Environment Locked</AlertTitle>
                <AlertDescription>
                    The environment is currently locked because submissions have already started.
                </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Terminal className="h-5 w-5" />
                            Runtime Environment
                        </CardTitle>
                        <CardDescription>Select the language and runner for this assignment.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Language / Framework</Label>
                            <Select defaultValue="nodejs20">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="nodejs20">Node.js 20.x</SelectItem>
                                    <SelectItem value="python311">Python 3.11</SelectItem>
                                    <SelectItem value="java17">Java 17 (OpenJDK)</SelectItem>
                                    <SelectItem value="cpp20">C++ 20 (GCC)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Custom Docker Image (Optional)</Label>
                            <Input placeholder="e.g. node:20-alpine" disabled />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Execution Limits
                        </CardTitle>
                        <CardDescription>Control resource usage per submission.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Timeout (seconds)</Label>
                                <span className="text-xs text-muted-foreground">30s</span>
                            </div>
                            <Slider defaultValue={[30]} max={300} step={1} />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Memory Limit (MB)</Label>
                                <span className="text-xs text-muted-foreground">512MB</span>
                            </div>
                            <Slider defaultValue={[512]} max={2048} step={128} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Cpu className="h-5 w-5" />
                            Grading Strategy
                        </CardTitle>
                        <CardDescription>Configure how test cases contribute to the final mark.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Stop on First Failure</Label>
                                <p className="text-sm text-muted-foreground">
                                    Execution stops immediately if any test case fails.
                                </p>
                            </div>
                            <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Calculate Partial Marks</Label>
                                <p className="text-sm text-muted-foreground">
                                    Marks are awarded proportionally based on passed test cases.
                                </p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Enable Retries</Label>
                                <p className="text-sm text-muted-foreground">
                                    Allow students to re-run autograder before final submission.
                                </p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end gap-3">
                <Button variant="outline">
                    <Play className="mr-2 h-4 w-4" />
                    Test Run on Sample
                </Button>
                <Button>
                    Save Configuration
                </Button>
            </div>
        </div>
    );
}
