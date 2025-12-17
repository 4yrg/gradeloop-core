"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MessageSquare, CheckCircle, XCircle } from "lucide-react"

export function GradingPanel() {
    // Mock Rubric
    const rubric = [
        { id: 1, criteria: "Correctness", max: 50, value: 45, comment: "Passes all test cases." },
        { id: 2, criteria: "Code Style", max: 20, value: 15, comment: "Variable naming could be better." },
        { id: 3, criteria: "Optimization", max: 30, value: 20, comment: "O(n^2) solution, can be O(n)." },
    ]

    return (
        <div className="flex flex-col h-full bg-card border-l">
            <div className="p-4 border-b">
                <h2 className="font-semibold">Assessment</h2>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-2xl font-bold">80<span className="text-sm text-muted-foreground font-normal">/100</span></span>
                    <Badge className="bg-green-600">Passing</Badge>
                </div>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                    {/* AI Insight */}
                    <Alert className="bg-purple-500/10 border-purple-500/20">
                        <MessageSquare className="h-4 w-4 text-purple-600" />
                        <AlertTitle className="text-purple-600 ml-2">AI Grading Insight</AlertTitle>
                        <AlertDescription className="text-xs text-muted-foreground mt-2">
                            Student uses nested loops unnecessarily. Suggested optimization: Use a hash map. Code clone probability: <span className="text-green-600 font-bold">Low (2%)</span>.
                            <div className="mt-2 flex gap-2">
                                <Button variant="outline" size="sm" className="h-6 text-xs border-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900">Insert as Comment</Button>
                            </div>
                        </AlertDescription>
                    </Alert>

                    {/* Rubric */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-sm">Rubric Scoring</h3>
                        {rubric.map(item => (
                            <div key={item.id} className="space-y-3 border p-3 rounded-md">
                                <div className="flex justify-between text-sm">
                                    <span>{item.criteria}</span>
                                    <span className="font-mono">{item.value} / {item.max}</span>
                                </div>
                                <Slider defaultValue={[item.value]} max={item.max} step={1} className="w-full" />
                                <Input className="h-8 text-xs" placeholder="Add comment..." defaultValue={item.comment} />
                            </div>
                        ))}
                    </div>

                    {/* Auto Tests */}
                    <div className="space-y-2">
                        <h3 className="font-medium text-sm">Automated Tests (Judge0)</h3>
                        <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-4 w-4" /> Test Case 1 (Input: [1,2,3])
                            </div>
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-4 w-4" /> Test Case 2 (Input: Empty)
                            </div>
                            <div className="flex items-center gap-2 text-red-500">
                                <XCircle className="h-4 w-4" /> Test Case 3 (Large Input)
                            </div>
                        </div>
                    </div>
                </div>
            </ScrollArea>

            <div className="p-4 border-t space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="publish">Release Feedback</Label>
                    <Switch id="publish" />
                </div>
                <Button className="w-full">Finalize Grade</Button>
            </div>
        </div>
    )
}
