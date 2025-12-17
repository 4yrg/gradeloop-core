"use client"

import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Clock, TriangleAlert, Code, ArrowRight } from "lucide-react"

export default function AssignmentDetailPage() {
    const params = useParams()
    const router = useRouter()
    const assignmentId = params.id as string

    // Mock Data
    const assignment = {
        id: assignmentId,
        title: "Lab 2: Loops & Arrays",
        description: "Implement a function that calculates the Fibonacci sequence up to N terms. Ensure your solution parses input from stdin.",
        due: "Tomorrow, 11:59 PM",
        rubric: [
            { criteria: "Correctness", points: 50 },
            { criteria: "Style", points: 20 },
            { criteria: "Performance", points: 30 },
        ],
        constraints: ["Python 3.10", "No external libraries", "Max runtime 2s"]
    }

    const handleStart = () => {
        // In real app, create submission record here
        router.push(`/ide/${assignmentId}`)
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div>
                        <Badge variant="outline" className="mb-2">Assignment</Badge>
                        <h1 className="text-3xl font-bold">{assignment.title}</h1>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-sm font-medium">
                            <Clock className="h-4 w-4" />
                            <span>Due {assignment.due}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Problem Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="leading-7">{assignment.description}</p>
                            <div className="mt-6">
                                <h4 className="font-semibold mb-2">Constraints:</h4>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                    {assignment.constraints.map(c => <li key={c}>{c}</li>)}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    <Alert>
                        <TriangleAlert className="h-4 w-4" />
                        <AlertTitle>Plagiarism Warning</AlertTitle>
                        <AlertDescription>
                            Your code will be analyzed by CIPAS. Type 1-4 clone detection is active.
                        </AlertDescription>
                    </Alert>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Grading Rubric</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {assignment.rubric.map(r => (
                                <div key={r.criteria} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                                    <span>{r.criteria}</span>
                                    <Badge variant="secondary">{r.points} pts</Badge>
                                </div>
                            ))}
                            <div className="pt-2 flex justify-between font-bold">
                                <span>Total</span>
                                <span>100 pts</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleStart} className="w-full" size="lg">
                                <Code className="mr-2 h-4 w-4" />
                                Launch IDE
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}
