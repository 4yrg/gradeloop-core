"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"

interface PageProps {
    params: {
        courseId: string
    }
}

export default function CreateAssignmentPage({ params }: PageProps) {
    return (
        <div className="flex flex-col min-h-[calc(100vh-theme(spacing.16))]">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/instructor/courses/${params.courseId}`}>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-semibold tracking-tight">Create assignment</h1>
            </div>

            <div className="max-w-2xl mx-auto w-full flex-1 space-y-8 pb-20">
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Assignment Name</Label>
                        <Input id="name" placeholder="e.g. Python Basics & Variables" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe the assignment requirements..."
                            className="min-h-[150px]"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="releaseDate">Release Date</Label>
                            <Input id="releaseDate" type="date" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="dueDate">Due Date</Label>
                            <Input id="dueDate" type="date" />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="points">Total Points</Label>
                        <Input id="points" type="number" placeholder="100" />
                    </div>
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
                <div className="flex h-14 items-center justify-between px-4 lg:px-8 max-w-screen-2xl mx-auto">
                    <Link href={`/instructor/courses/${params.courseId}`}>
                        <Button variant="ghost" size="sm">
                            Cancel
                        </Button>
                    </Link>
                    <Button size="sm" className="gap-2 bg-black hover:bg-black/90 text-white">
                        <Save className="h-4 w-4" />
                        Create assignment
                    </Button>
                </div>
            </div>
        </div>
    )
}
