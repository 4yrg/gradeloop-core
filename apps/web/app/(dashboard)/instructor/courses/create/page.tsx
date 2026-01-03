"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"

export default function CreateCoursePage() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-theme(spacing.16))]">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/instructor/courses">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-semibold tracking-tight">Create a new course</h1>
            </div>

            <div className="max-w-2xl mx-auto w-full flex-1 space-y-8 pb-20">
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Course Title</Label>
                        <Input id="title" placeholder="e.g. Introduction to Programming" />
                        <p className="text-sm text-muted-foreground">
                            The name of the course visible to students.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="code">Course Code</Label>
                        <Input id="code" placeholder="e.g. IT1010" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="semester">Semester</Label>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a semester" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2025-s1">2025 Semester 1</SelectItem>
                                <SelectItem value="2025-s2">2025 Semester 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Briefly describe what this course is about..."
                            className="min-h-[150px]"
                        />
                    </div>
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
                <div className="flex h-14 items-center justify-between px-4 lg:px-8">
                    <Link href="/instructor/courses">
                        <Button variant="ghost" size="sm">
                            Cancel
                        </Button>
                    </Link>
                    <Button size="sm" className="gap-2 bg-black hover:bg-black/90 text-white">
                        <Save className="h-4 w-4" />
                        Create course
                    </Button>
                </div>
            </div>
        </div>
    )
}
