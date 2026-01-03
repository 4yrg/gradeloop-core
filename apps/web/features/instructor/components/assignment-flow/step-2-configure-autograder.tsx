"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { FileText, Upload, Wrench, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function Step2ConfigureAutograder() {
    const [configType, setConfigType] = React.useState<"zip" | "manual">("zip")
    const [file, setFile] = React.useState<File | null>(null)

    return (
        <div className="flex flex-col h-full p-8 max-w-4xl mx-auto w-full gap-8">
            <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">Configure Autograder</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                        Upload your autograder code and change settings here. You can also come back to this step later.
                        But submissions will not be automatically graded until then. Please follow our guidelines for structuring the autograder.
                    </p>
                    <div className="flex items-start gap-2 bg-muted/50 p-4 border rounded-md text-sm text-foreground">
                        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <p>
                            Note: Uploading the autograder zip file will automatically update your docker image name once it built successfully.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Autograder Configuration</h3>
                    <RadioGroup
                        defaultValue="zip"
                        className="flex gap-8"
                        value={configType}
                        onValueChange={(v) => setConfigType(v as "zip" | "manual")}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="zip" id="zip" />
                            <Label htmlFor="zip" className="font-medium cursor-pointer">Zip file upload</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="manual" id="manual" />
                            <Label htmlFor="manual" className="font-medium cursor-pointer">Manual Setup</Label>
                        </div>
                    </RadioGroup>
                </div>

                {configType === "zip" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div>
                            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">Autograder</h3>
                            <div className="flex items-center gap-4">
                                <FileText className="h-5 w-5" />
                                <span className="font-medium">Please select a file:</span>

                                <div className="flex flex-1 max-w-md items-center gap-2">
                                    <Input
                                        readOnly
                                        value={file ? file.name : "Select Autograder (.zip)"}
                                        className="bg-muted cursor-pointer text-muted-foreground text-center"
                                        onClick={() => document.getElementById('autograder-upload')?.click()}
                                    />
                                    <input
                                        id="autograder-upload"
                                        type="file"
                                        accept=".zip"
                                        className="hidden"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                            <Button className="bg-foreground text-background hover:bg-foreground/90 rounded-none px-6">
                                Update Autograder
                            </Button>
                            <Button variant="ghost" className="rounded-none gap-2">
                                <Wrench className="h-4 w-4" />
                                Test Autograder
                            </Button>
                        </div>
                    </div>
                )}

                {configType === "manual" && (
                    <Card className="bg-muted/10 border-dashed animate-in fade-in slide-in-from-top-2 duration-300">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-4 text-muted-foreground">
                            <Wrench className="h-12 w-12 opacity-20" />
                            <div className="space-y-1">
                                <h3 className="font-semibold text-foreground">Manual Configuration</h3>
                                <p className="text-sm">Configure Docker image and build steps manually.</p>
                            </div>
                            <Button variant="outline">Open Advanced Settings</Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
