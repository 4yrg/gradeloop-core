"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
    FileText,
    X,
    ChevronLeft,
    FlaskConical,
    FileSignature,
    MonitorPlay,
    Info,
    Upload
} from "lucide-react"
import { useAssignmentStore } from "@/store/use-assignment-store"
import { createAssignmentSchema, CreateAssignmentValues } from "@/lib/validations/assignment"
import { cn } from "@/lib/utils"
import { DatePicker } from "@/components/ui/date-picker"

const assignmentTypes = [
    { id: "Lab", label: "Lab", icon: FlaskConical },
    { id: "Exam", label: "Exam", icon: FileSignature },
    { id: "Demo", label: "Demo", icon: MonitorPlay },
] as const;

export function CreateAssignmentDialog() {
    const { isOpen, step, formData, setOpen, setStep, setFormData, reset } = useAssignmentStore()

    const form = useForm<CreateAssignmentValues>({
        resolver: zodResolver(createAssignmentSchema) as any,
        defaultValues: {
            type: "Lab",
            name: "",
            autograderPoints: 100,
            allowManualGrading: false,
            allowLateSubmissions: false,
            enforceTimeLimit: false,
            enableGroupSubmissions: false,
            enableLeaderboard: false,
            enableAiAssistance: false,
            ...formData,
        } as any,
    })

    const selectedType = form.watch("type")

    const handleNext = async () => {
        if (step === 1) {
            if (!selectedType) return
            setStep(2)
        } else {
            const isValid = await form.trigger()
            if (isValid) {
                console.log("Form submitted:", form.getValues())
                // In a real app, call mutation here
                reset()
            }
        }
    }

    const handleBack = () => {
        if (step === 2) {
            setStep(1)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && reset()}>
            <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0 overflow-hidden rounded-none flex flex-col border-none shadow-2xl">
                {/* Custom Header */}
                <div className="bg-[#B3B3B3] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {step === 2 && (
                            <button onClick={handleBack} className="hover:opacity-70">
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                        )}
                        <h2 className="text-xl font-bold">{step === 1 ? "Create assignment" : "Assignment Settings"}</h2>
                    </div>
                    <button onClick={() => reset()} className="hover:opacity-70">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 border-r flex flex-col p-6 gap-6 bg-background">
                        <h3 className="font-bold">Assignment Type</h3>
                        <div className="flex flex-col gap-4">
                            {assignmentTypes.map((type) => {
                                const Icon = type.icon
                                const isSelected = selectedType === type.id
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => step === 1 && form.setValue("type", type.id)}
                                        className={cn(
                                            "flex items-center gap-4 p-2 transition-colors text-left",
                                            isSelected ? "text-primary" : "text-muted-foreground hover:text-foreground",
                                            step === 2 && !isSelected && "hidden"
                                        )}
                                    >
                                        <Icon className="h-6 w-6" />
                                        <span className="font-medium text-lg">{type.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto p-10 bg-background">
                        {step === 1 ? (
                            <div className="h-full flex items-center justify-center">
                                <span className="text-2xl font-bold">Select an assignment type</span>
                            </div>
                        ) : (
                            <Form {...form}>
                                <form className="flex flex-col gap-8 max-w-2xl">
                                    <FormField
                                        control={form.control as any}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Assignment Name"
                                                        className="border-x-0 border-t-0 border-b rounded-none px-0 text-xl font-medium focus-visible:ring-0 placeholder:text-muted-foreground/50"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Template</span>
                                            <div className="bg-[#E5E5E5] px-2 py-1 flex items-center gap-2 text-[10px] text-foreground">
                                                <Info className="h-3 w-3 fill-black text-white" />
                                                <span>For more about grading template guidelines at <span className="font-bold underline">gradeloop grading template</span></span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <FileText className="h-6 w-6" />
                                            <span className="text-sm">
                                                {form.watch("templateFile") ? (form.watch("templateFile") as File).name : "Please select a file:"}
                                            </span>
                                            <input
                                                type="file"
                                                accept=".json"
                                                className="hidden"
                                                id="template-upload"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) form.setValue("templateFile", file)
                                                }}
                                            />
                                            <Button
                                                variant="outline"
                                                className="bg-[#D9D9D9] border-black border h-8 rounded-none px-8 font-normal"
                                                type="button"
                                                onClick={() => document.getElementById("template-upload")?.click()}
                                            >
                                                select .json
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-10">
                                        <FormField
                                            control={form.control as any}
                                            name="autograderPoints"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm">Autograder points</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            className="border-x-0 border-t-0 border-b rounded-none px-0 focus-visible:ring-0"
                                                            {...field}
                                                            value={field.value ?? ""}
                                                            onChange={e => {
                                                                const val = parseInt(e.target.value)
                                                                field.onChange(isNaN(val) ? undefined : val)
                                                            }}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control as any}
                                            name="allowManualGrading"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-6">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal text-base">Allow manual grading</FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-10">
                                        <FormField
                                            control={form.control as any}
                                            name="releaseDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Release Date</FormLabel>
                                                    <DatePicker
                                                        date={field.value}
                                                        setDate={field.onChange}
                                                        placeholder="Click to set date & time"
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control as any}
                                            name="dueDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Due Date</FormLabel>
                                                    <DatePicker
                                                        date={field.value}
                                                        setDate={field.onChange}
                                                        placeholder="Click to set date & time"
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-10">
                                        <FormField
                                            control={form.control as any}
                                            name="allowLateSubmissions"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal text-base">Allow late submissions</FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control as any}
                                            name="lateDueDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel className={cn(!form.watch("allowLateSubmissions") && "text-muted-foreground")}>Late Due Date</FormLabel>
                                                    <DatePicker
                                                        date={field.value}
                                                        setDate={field.onChange}
                                                        placeholder="Click to set date & time"
                                                    />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-10">
                                        <FormField
                                            control={form.control as any}
                                            name="enforceTimeLimit"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal text-base">Enforce time limit</FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control as any}
                                            name="timeLimit"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel className={cn(!form.watch("enforceTimeLimit") && "text-muted-foreground")}>Maximum time permitted (minutes)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            className="border-x-0 border-t-0 border-b rounded-none px-0 focus-visible:ring-0"
                                                            {...field}
                                                            value={field.value ?? ""}
                                                            onChange={e => {
                                                                const val = parseInt(e.target.value)
                                                                field.onChange(isNaN(val) ? undefined : val)
                                                            }}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-6">
                                        <h4 className="font-bold">Group submissions</h4>
                                        <div className="grid grid-cols-2 gap-10">
                                            <FormField
                                                control={form.control as any}
                                                name="enableGroupSubmissions"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="font-normal text-base">Enable group submissions</FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control as any}
                                                name="groupSizeLimit"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel className={cn(!form.watch("enableGroupSubmissions") && "text-muted-foreground")}>Limit group size (number)</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                className="border-x-0 border-t-0 border-b rounded-none px-0 focus-visible:ring-0"
                                                                {...field}
                                                                value={field.value ?? ""}
                                                                onChange={e => {
                                                                    const val = parseInt(e.target.value)
                                                                    field.onChange(isNaN(val) ? undefined : val)
                                                                }}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-6">
                                        <h4 className="font-bold">Enable leader board</h4>
                                        <div className="grid grid-cols-2 gap-10">
                                            <FormField
                                                control={form.control as any}
                                                name="enableLeaderboard"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="font-normal text-base">Enable leader board</FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control as any}
                                                name="leaderboardEntries"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel className={cn(!form.watch("enableLeaderboard") && "text-muted-foreground")}>Default # of entries (number)</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                className="border-x-0 border-t-0 border-b rounded-none px-0 focus-visible:ring-0"
                                                                {...field}
                                                                value={field.value ?? ""}
                                                                onChange={e => {
                                                                    const val = parseInt(e.target.value)
                                                                    field.onChange(isNaN(val) ? undefined : val)
                                                                }}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-6">
                                        <h4 className="font-bold">AI assistance</h4>
                                        <FormField
                                            control={form.control as any}
                                            name="enableAiAssistance"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal text-base">Enable Socratic AI assistance</FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </form>
                            </Form>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-[#E5E5E5] px-6 py-4 flex items-center justify-end gap-4 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
                    <Button
                        variant="ghost"
                        onClick={() => reset()}
                        className="bg-[#333333] text-white hover:bg-[#333333]/90 hover:text-white rounded-none px-8 h-10"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={step === 1 && !selectedType}
                        className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90 rounded-none px-12 h-10 transition-all font-bold"
                    >
                        {step === 1 ? "Next" : "Create"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
