"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
    FileText,
    GripVertical,
    Plus,
    Trash2,
    ArrowLeft,
    ArrowRight,
    Check,
    Code,
    TestTube,
    Settings as SettingsIcon
} from "lucide-react"
import { InstructorService } from "@/services/instructor.service"
import { toast } from "sonner"

type AssignmentData = {
    // Step 1: Metadata
    title: string
    description: string
    courseId: string
    dueDate: string
    language: string
    timeLimit: number
    memoryLimit: number

    // Step 2: Rubric
    rubric: {
        id: string
        name: string
        description: string
        weight: number
        autoGrade: boolean
    }[]

    // Step 3: Test Cases
    testCases: {
        id: string
        type: 'text' | 'code'
        input: string
        expectedOutput: string
        isHidden: boolean
        points: number
    }[]

    // Step 4: Features
    enableAI: boolean
    enableCIPAS: boolean
    allowResubmissions: boolean
    maxResubmissions: number
}

export default function CreateAssignmentPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [assignmentData, setAssignmentData] = useState<AssignmentData>({
        title: "",
        description: "",
        courseId: "",
        dueDate: "",
        language: "java",
        timeLimit: 2000,
        memoryLimit: 256,
        rubric: [
            { id: "1", name: "Correctness", description: "Solution produces correct output", weight: 40, autoGrade: true },
            { id: "2", name: "Code Quality", description: "Clean, readable code", weight: 30, autoGrade: false },
            { id: "3", name: "Efficiency", description: "Optimal time/space complexity", weight: 20, autoGrade: false },
            { id: "4", name: "Documentation", description: "Comments and documentation", weight: 10, autoGrade: false }
        ],
        testCases: [],
        enableAI: true,
        enableCIPAS: true,
        allowResubmissions: true,
        maxResubmissions: 3
    })

    const steps = [
        { number: 1, title: "Metadata", icon: FileText },
        { number: 2, title: "Rubric", icon: Code },
        { number: 3, title: "Test Cases", icon: TestTube },
        { number: 4, title: "Features", icon: SettingsIcon }
    ]

    const handleNext = () => {
        if (currentStep < 4) setCurrentStep(currentStep + 1)
    }

    const handlePrevious = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1)
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            await InstructorService.createAssignment(assignmentData)
            toast.success("Assignment created successfully!")
            router.push("/instructor/assignments")
        } catch (error) {
            toast.error("Failed to create assignment")
        } finally {
            setIsSubmitting(false)
        }
    }

    const addRubricItem = () => {
        setAssignmentData({
            ...assignmentData,
            rubric: [
                ...assignmentData.rubric,
                {
                    id: Date.now().toString(),
                    name: "",
                    description: "",
                    weight: 0,
                    autoGrade: false
                }
            ]
        })
    }

    const removeRubricItem = (id: string) => {
        setAssignmentData({
            ...assignmentData,
            rubric: assignmentData.rubric.filter(item => item.id !== id)
        })
    }

    const updateRubricItem = (id: string, field: string, value: any) => {
        setAssignmentData({
            ...assignmentData,
            rubric: assignmentData.rubric.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        })
    }

    const addTestCase = () => {
        setAssignmentData({
            ...assignmentData,
            testCases: [
                ...assignmentData.testCases,
                {
                    id: Date.now().toString(),
                    type: 'code',
                    input: '',
                    expectedOutput: '',
                    isHidden: false,
                    points: 10
                }
            ]
        })
    }

    const removeTestCase = (id: string) => {
        setAssignmentData({
            ...assignmentData,
            testCases: assignmentData.testCases.filter(tc => tc.id !== id)
        })
    }

    const updateTestCase = (id: string, field: string, value: any) => {
        setAssignmentData({
            ...assignmentData,
            testCases: assignmentData.testCases.map(tc =>
                tc.id === id ? { ...tc, [field]: value } : tc
            )
        })
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Create Assignment</h1>
                <p className="text-muted-foreground">Set up a new coding assignment with rubrics and test cases</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between">
                {steps.map((step, idx) => (
                    <div key={step.number} className="flex items-center flex-1">
                        <div className="flex flex-col items-center gap-2">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors ${currentStep >= step.number
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background border-muted-foreground/30'
                                }`}>
                                {currentStep > step.number ? (
                                    <Check className="h-5 w-5" />
                                ) : (
                                    <step.icon className="h-5 w-5" />
                                )}
                            </div>
                            <span className={`text-sm font-medium ${currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                                }`}>
                                {step.title}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-4 transition-colors ${currentStep > step.number ? 'bg-primary' : 'bg-muted-foreground/30'
                                }`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <Card>
                <CardHeader>
                    <CardTitle>Step {currentStep}: {steps[currentStep - 1].title}</CardTitle>
                    <CardDescription>
                        {currentStep === 1 && "Basic assignment information and constraints"}
                        {currentStep === 2 && "Define grading criteria and weights"}
                        {currentStep === 3 && "Create test cases for auto-grading"}
                        {currentStep === 4 && "Configure assignment features"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* STEP 1: METADATA */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Assignment Title *</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., Binary Search Implementation"
                                    value={assignmentData.title}
                                    onChange={(e) => setAssignmentData({ ...assignmentData, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe the assignment objectives and requirements..."
                                    rows={4}
                                    value={assignmentData.description}
                                    onChange={(e) => setAssignmentData({ ...assignmentData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="course">Course *</Label>
                                    <Select value={assignmentData.courseId} onValueChange={(value) => setAssignmentData({ ...assignmentData, courseId: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select course" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="c1">IT1030 - Mathematics for Computing</SelectItem>
                                            <SelectItem value="c2">SE3040 - Advanced Software Engineering</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dueDate">Due Date *</Label>
                                    <Input
                                        id="dueDate"
                                        type="datetime-local"
                                        value={assignmentData.dueDate}
                                        onChange={(e) => setAssignmentData({ ...assignmentData, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="language">Programming Language *</Label>
                                    <Select value={assignmentData.language} onValueChange={(value) => setAssignmentData({ ...assignmentData, language: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="java">Java</SelectItem>
                                            <SelectItem value="python">Python</SelectItem>
                                            <SelectItem value="javascript">JavaScript</SelectItem>
                                            <SelectItem value="cpp">C++</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="timeLimit">Time Limit (ms)</Label>
                                    <Input
                                        id="timeLimit"
                                        type="number"
                                        value={assignmentData.timeLimit}
                                        onChange={(e) => setAssignmentData({ ...assignmentData, timeLimit: parseInt(e.target.value) })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="memoryLimit">Memory Limit (MB)</Label>
                                    <Input
                                        id="memoryLimit"
                                        type="number"
                                        value={assignmentData.memoryLimit}
                                        onChange={(e) => setAssignmentData({ ...assignmentData, memoryLimit: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: RUBRIC */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-muted-foreground">
                                    Total Weight: {assignmentData.rubric.reduce((sum, item) => sum + item.weight, 0)}%
                                </p>
                                <Button onClick={addRubricItem} variant="outline" size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Criterion
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {assignmentData.rubric.map((item, idx) => (
                                    <Card key={item.id}>
                                        <CardContent className="pt-6">
                                            <div className="flex gap-4">
                                                <div className="flex items-center cursor-move">
                                                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1 space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <Input
                                                            placeholder="Criterion name"
                                                            value={item.name}
                                                            onChange={(e) => updateRubricItem(item.id, 'name', e.target.value)}
                                                        />
                                                        <div className="flex gap-2">
                                                            <Input
                                                                type="number"
                                                                placeholder="Weight %"
                                                                value={item.weight}
                                                                onChange={(e) => updateRubricItem(item.id, 'weight', parseInt(e.target.value) || 0)}
                                                                className="w-24"
                                                            />
                                                            <Badge variant={item.autoGrade ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => updateRubricItem(item.id, 'autoGrade', !item.autoGrade)}>
                                                                {item.autoGrade ? 'Auto' : 'Manual'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <Textarea
                                                        placeholder="Description"
                                                        value={item.description}
                                                        onChange={(e) => updateRubricItem(item.id, 'description', e.target.value)}
                                                        rows={2}
                                                    />
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeRubricItem(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: TEST CASES */}
                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-muted-foreground">
                                    {assignmentData.testCases.length} test case(s)
                                </p>
                                <Button onClick={addTestCase} variant="outline" size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Test Case
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {assignmentData.testCases.map((tc, idx) => (
                                    <Card key={tc.id}>
                                        <CardContent className="pt-6">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <Badge variant="outline">Test Case {idx + 1}</Badge>
                                                    <div className="flex gap-2">
                                                        <Badge
                                                            variant={tc.isHidden ? 'secondary' : 'default'}
                                                            className="cursor-pointer"
                                                            onClick={() => updateTestCase(tc.id, 'isHidden', !tc.isHidden)}
                                                        >
                                                            {tc.isHidden ? 'Hidden' : 'Visible'}
                                                        </Badge>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeTestCase(tc.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                        <Label>Input</Label>
                                                        <Textarea
                                                            placeholder="Test input"
                                                            value={tc.input}
                                                            onChange={(e) => updateTestCase(tc.id, 'input', e.target.value)}
                                                            rows={3}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Expected Output</Label>
                                                        <Textarea
                                                            placeholder="Expected output"
                                                            value={tc.expectedOutput}
                                                            onChange={(e) => updateTestCase(tc.id, 'expectedOutput', e.target.value)}
                                                            rows={3}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="w-32">
                                                    <Label>Points</Label>
                                                    <Input
                                                        type="number"
                                                        value={tc.points}
                                                        onChange={(e) => updateTestCase(tc.id, 'points', parseInt(e.target.value) || 0)}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {assignmentData.testCases.length === 0 && (
                                <div className="text-center py-12 border rounded-lg bg-muted/10">
                                    <TestTube className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                    <p className="text-muted-foreground">No test cases added yet</p>
                                    <Button className="mt-4" onClick={addTestCase} variant="outline">
                                        Add Your First Test Case
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 4: FEATURES */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <h4 className="font-medium">AI Assistance</h4>
                                        <p className="text-sm text-muted-foreground">Enable Socratic chatbot for students</p>
                                    </div>
                                    <Button
                                        variant={assignmentData.enableAI ? 'default' : 'outline'}
                                        onClick={() => setAssignmentData({ ...assignmentData, enableAI: !assignmentData.enableAI })}
                                    >
                                        {assignmentData.enableAI ? 'Enabled' : 'Disabled'}
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <h4 className="font-medium">CIPAS Detection</h4>
                                        <p className="text-sm text-muted-foreground">Plagiarism and AI-generated code detection</p>
                                    </div>
                                    <Button
                                        variant={assignmentData.enableCIPAS ? 'default' : 'outline'}
                                        onClick={() => setAssignmentData({ ...assignmentData, enableCIPAS: !assignmentData.enableCIPAS })}
                                    >
                                        {assignmentData.enableCIPAS ? 'Enabled' : 'Disabled'}
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <h4 className="font-medium">Allow Resubmissions</h4>
                                        <p className="text-sm text-muted-foreground">Let students resubmit their work</p>
                                        {assignmentData.allowResubmissions && (
                                            <div className="mt-3 flex items-center gap-2">
                                                <Label htmlFor="maxResubmissions" className="text-sm">Max attempts:</Label>
                                                <Input
                                                    id="maxResubmissions"
                                                    type="number"
                                                    value={assignmentData.maxResubmissions}
                                                    onChange={(e) => setAssignmentData({ ...assignmentData, maxResubmissions: parseInt(e.target.value) || 1 })}
                                                    className="w-20"
                                                    min={1}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        variant={assignmentData.allowResubmissions ? 'default' : 'outline'}
                                        onClick={() => setAssignmentData({ ...assignmentData, allowResubmissions: !assignmentData.allowResubmissions })}
                                    >
                                        {assignmentData.allowResubmissions ? 'Enabled' : 'Disabled'}
                                    </Button>
                                </div>
                            </div>

                            {/* Summary */}
                            <Card className="bg-muted/50">
                                <CardHeader>
                                    <CardTitle className="text-lg">Assignment Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Title:</span>
                                        <span className="font-medium">{assignmentData.title || 'Not set'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Rubric Criteria:</span>
                                        <span className="font-medium">{assignmentData.rubric.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Test Cases:</span>
                                        <span className="font-medium">{assignmentData.testCases.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Features:</span>
                                        <span className="font-medium">
                                            {[assignmentData.enableAI && 'AI', assignmentData.enableCIPAS && 'CIPAS', assignmentData.allowResubmissions && 'Resubmit'].filter(Boolean).join(', ') || 'None'}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                </Button>

                {currentStep < 4 ? (
                    <Button onClick={handleNext}>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Assignment'}
                        <Check className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}
