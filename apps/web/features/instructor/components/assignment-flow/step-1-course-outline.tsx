"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, GripVertical, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface RubricItem {
    id: string
    question: string
    criteria: string
    points: number
}

export function Step1CourseOutline() {
    const [rubricItems, setRubricItems] = React.useState<RubricItem[]>([
        { id: "1", question: "Function Logic", criteria: "Correctly implements the algorithm.", points: 10 }
    ])

    const addRubricItem = () => {
        const newItem: RubricItem = {
            id: Math.random().toString(36).substr(2, 9),
            question: "New Question",
            criteria: "",
            points: 0
        }
        setRubricItems([...rubricItems, newItem])
    }

    const updateRubricItem = (id: string, field: keyof RubricItem, value: any) => {
        setRubricItems(items => items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ))
    }

    const deleteRubricItem = (id: string) => {
        setRubricItems(items => items.filter(item => item.id !== id))
    }

    const totalPoints = rubricItems.reduce((sum, item) => sum + (item.points || 0), 0)

    return (
        <div className="flex h-full">
            {/* Center Content: Course Outline */}
            <div className="flex-1 p-8 overflow-auto max-w-3xl mx-auto w-full">
                <div className="space-y-8 pb-20">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Assignment Outline</h2>
                        <p className="text-muted-foreground">Define the core problem and requirements for this assignment.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="problem-question" className="text-base font-semibold">Problem Question</Label>
                            <Input
                                id="problem-question"
                                placeholder="e.g., Implement a Binary Search Tree"
                                className="text-lg font-medium h-12"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-base font-semibold">Description & Learning Outcomes</Label>
                            <Card className="border-dashed bg-muted/20">
                                <CardContent className="p-0">
                                    <Textarea
                                        id="description"
                                        placeholder="Describe the assignment. Highlight core concepts, skills, and expected outcomes..."
                                        className="min-h-[300px] resize-none border-none focus-visible:ring-0 bg-transparent p-4"
                                    />
                                </CardContent>
                            </Card>
                            <p className="text-xs text-muted-foreground">
                                Markdown is supported. Make sure to clearly outline the grading criteria in the description as well.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Sidebar: Rubric Builder */}
            <div className="w-[400px] border-l bg-background flex flex-col h-full">
                <div className="p-4 border-b bg-muted/10 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg">Rubric Builder</h3>
                        <p className="text-xs text-muted-foreground">Total Points: <span className="font-bold text-primary">{totalPoints}</span></p>
                    </div>
                    <Button size="sm" onClick={addRubricItem}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                    </Button>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                        {rubricItems.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-2">
                                <AlertCircle className="h-8 w-8 opacity-20" />
                                <p>No rubric items defined yet.</p>
                                <Button variant="link" onClick={addRubricItem}>Add your first question</Button>
                            </div>
                        ) : (
                            rubricItems.map((item, index) => (
                                <Card key={item.id} className="relative group">
                                    <CardHeader className="p-3 pb-0">
                                        <div className="flex items-center gap-2">
                                            <div className="cursor-grab hover:bg-muted rounded p-1 text-muted-foreground">
                                                <GripVertical className="h-4 w-4" />
                                            </div>
                                            <Input
                                                value={item.question}
                                                onChange={(e) => updateRubricItem(item.id, "question", e.target.value)}
                                                className="h-8 font-bold border-transparent hover:border-input focus:border-input px-2 transition-all"
                                                placeholder="Question Title"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2"
                                                onClick={() => deleteRubricItem(item.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-2 space-y-3">
                                        <Textarea
                                            value={item.criteria}
                                            onChange={(e) => updateRubricItem(item.id, "criteria", e.target.value)}
                                            placeholder="What is expected? Explain grading criteria..."
                                            className="text-sm min-h-[60px] resize-none"
                                        />
                                        <div className="flex items-center justify-end gap-2">
                                            <Label className="text-xs text-muted-foreground uppercase font-bold">Points</Label>
                                            <Input
                                                type="number"
                                                value={item.points}
                                                onChange={(e) => updateRubricItem(item.id, "points", parseInt(e.target.value) || 0)}
                                                className="h-8 w-16 text-right"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
