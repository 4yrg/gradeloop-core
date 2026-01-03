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
import { useRouter, useParams } from "next/navigation"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
    RadioGroup,
    RadioGroupItem
} from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

const assignmentTypes = [
    { id: "Lab", label: "Lab", icon: FlaskConical },
    { id: "Exam", label: "Exam", icon: FileSignature },
    { id: "Demo", label: "Demo", icon: MonitorPlay },
] as const;

export function CreateAssignmentDialog() {
    const { isOpen, step, formData, setOpen, setStep, setFormData, reset } = useAssignmentStore()
    const router = useRouter()
    const params = useParams()
    const courseId = params?.id as string // Assuming we are in a course context

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
                // In a real app, call mutation here.
                // For now, we simulate creation and redirect to the configuration flow.
                const newAssignmentId = Math.random().toString(36).substr(2, 9) // Mock ID

                // Close dialog
                setOpen(false)
                reset()

                // Redirect to the new Manage Assignment Flow
                // Use a default ID or the one created
                const targetUrl = `/instructor/courses/${courseId || "1"}/assignments/${newAssignmentId}/manage`
                router.push(targetUrl)
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
            <DialogContent
                showCloseButton={false}
                className="sm:max-w-[1400px] w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden rounded-none flex flex-col border-none shadow-2xl"
            >
                {/* Custom Header */}
                <div className="bg-muted px-6 py-4 flex items-center justify-between border-b">
                    <div className="flex items-center gap-4">
                        {step === 2 && (
                            <button onClick={handleBack} className="hover:opacity-70 transition-opacity">
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                        )}
                        <DialogTitle className="text-xl font-bold tracking-tight">{step === 1 ? "Create assignment" : "Assignment Settings"}</DialogTitle>
                    </div>
                    <button onClick={() => reset()} className="hover:opacity-70 transition-opacity">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 border-r flex flex-col p-6 gap-6 bg-muted/30">
                        <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Assignment Type</h3>
                        <RadioGroup
                            value={selectedType}
                            onValueChange={(value) => step === 1 && form.setValue("type", value as any)}
                            className="flex flex-col gap-2"
                        >
                            {assignmentTypes.map((type) => {
                                const Icon = type.icon
                                const isSelected = selectedType === type.id
                                if (step === 2 && !isSelected) return null

                                return (
                                    <div key={type.id} className="relative">
                                        <RadioGroupItem
                                            value={type.id}
                                            id={type.id}
                                            className="peer sr-only"
                                            disabled={step === 2}
                                        />
                                        <Label
                                            htmlFor={type.id}
                                            className={cn(
                                                "flex items-center gap-4 p-3 transition-all cursor-pointer border-2 border-transparent hover:bg-muted rounded-none",
                                                isSelected ? "border-primary bg-background shadow-sm" : "text-muted-foreground",
                                                step === 2 && "cursor-default hover:bg-transparent"
                                            )}
                                        >
                                            <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                                            <span className="font-semibold">{type.label}</span>
                                        </Label>
                                    </div>
                                )
                            })}
                        </RadioGroup>
                    </div>

                    {/* Main Content */}
                    <ScrollArea className="flex-1 bg-background" viewportClassName="[&>div]:h-full">
                        <div className="p-10 h-full flex flex-col">
                            {step === 1 ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                    <FlaskConical className="h-16 w-16 text-muted-foreground/20" />
                                    <span className="text-2xl font-bold text-muted-foreground">Select an assignment type to continue</span>
                                </div>
                            ) : (
                                <Form {...form}>
                                    <form className="flex flex-col gap-10">
                                        <FormField
                                            control={form.control as any}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Assignment Name"
                                                            className="border-x-0 border-t-0 border-b-2 rounded-none px-0 text-3xl font-bold focus-visible:ring-0 placeholder:text-muted-foreground/30 h-auto py-2"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <section className="space-y-6">
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-lg">Grading Template</h4>
                                                    <div className="bg-secondary/50 px-3 py-1 flex items-center gap-2 text-[11px] font-medium text-muted-foreground uppercase tracking-tight">
                                                        <Info className="h-3.5 w-3.5 text-primary" />
                                                        <span>Guidelines at <span className="font-bold underline cursor-pointer">gradeloop template docs</span></span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 p-4 border bg-muted/10">
                                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                                    <div className="flex flex-col flex-1 shrink min-w-0">
                                                        <span className="text-sm font-medium truncate">
                                                            {form.watch("templateFile") ? (form.watch("templateFile") as File).name : "No file selected"}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">Please upload a valid .json template</span>
                                                    </div>
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
                                                        className="bg-secondary border-primary/20 hover:bg-secondary/80 h-9 rounded-none px-6 font-semibold"
                                                        type="button"
                                                        onClick={() => document.getElementById("template-upload")?.click()}
                                                    >
                                                        <Upload className="h-4 w-4 mr-2" />
                                                        Select File
                                                    </Button>
                                                </div>
                                            </div>
                                        </section>

                                        <Separator />

                                        <section className="space-y-8">
                                            <h4 className="font-bold text-lg">Scoring & Grading</h4>
                                            <div className="grid grid-cols-2 gap-12">
                                                <FormField
                                                    control={form.control as any}
                                                    name="autograderPoints"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Autograder points</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    className="border-x-0 border-t-0 border-b rounded-none px-0 focus-visible:ring-0 text-lg font-medium"
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
                                                                    className="h-5 w-5 rounded-none"
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-semibold text-base cursor-pointer">Allow manual grading</FormLabel>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </section>

                                        <Separator />

                                        <section className="space-y-8">
                                            <h4 className="font-bold text-lg">Availability & Deadlines</h4>
                                            <div className="grid grid-cols-2 gap-12">
                                                <FormField
                                                    control={form.control as any}
                                                    name="releaseDate"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col">
                                                            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Release Date</FormLabel>
                                                            <DatePicker
                                                                date={field.value}
                                                                setDate={field.onChange}
                                                                placeholder="Set release date"
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
                                                            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Due Date</FormLabel>
                                                            <DatePicker
                                                                date={field.value}
                                                                setDate={field.onChange}
                                                                placeholder="Set due date"
                                                            />
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-12">
                                                <FormField
                                                    control={form.control as any}
                                                    name="allowLateSubmissions"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-6">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value}
                                                                    onCheckedChange={field.onChange}
                                                                    className="h-5 w-5 rounded-none"
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-semibold text-base cursor-pointer">Allow late submissions</FormLabel>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control as any}
                                                    name="lateDueDate"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col">
                                                            <FormLabel className={cn("text-xs uppercase tracking-wider font-bold mb-1", !form.watch("allowLateSubmissions") ? "text-muted-foreground/40" : "text-muted-foreground")}>Late Due Date</FormLabel>
                                                            <DatePicker
                                                                date={field.value}
                                                                setDate={field.onChange}
                                                                placeholder="Set late due date"
                                                            />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </section>

                                        <Separator />

                                        <section className="space-y-8">
                                            <h4 className="font-bold text-lg">Execution Environment</h4>
                                            <div className="grid grid-cols-2 gap-12">
                                                <FormField
                                                    control={form.control as any}
                                                    name="enforceTimeLimit"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-6">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value}
                                                                    onCheckedChange={field.onChange}
                                                                    className="h-5 w-5 rounded-none"
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-semibold text-base cursor-pointer">Enforce time limit</FormLabel>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control as any}
                                                    name="timeLimit"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col">
                                                            <FormLabel className={cn("text-xs uppercase tracking-wider font-bold mb-1", !form.watch("enforceTimeLimit") ? "text-muted-foreground/40" : "text-muted-foreground")}>Time permitted (minutes)</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    className="border-x-0 border-t-0 border-b rounded-none px-0 focus-visible:ring-0 text-lg font-medium"
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
                                        </section>

                                        <Separator />

                                        <section className="space-y-8">
                                            <h4 className="font-bold text-lg">Social & Collaboration</h4>
                                            <div className="space-y-8">
                                                <div className="grid grid-cols-2 gap-12">
                                                    <FormField
                                                        control={form.control as any}
                                                        name="enableGroupSubmissions"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-6">
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value}
                                                                        onCheckedChange={field.onChange}
                                                                        className="h-5 w-5 rounded-none"
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-semibold text-base cursor-pointer">Enable group submissions</FormLabel>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control as any}
                                                        name="groupSizeLimit"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col">
                                                                <FormLabel className={cn("text-xs uppercase tracking-wider font-bold mb-1", !form.watch("enableGroupSubmissions") ? "text-muted-foreground/40" : "text-muted-foreground")}>Limit group size</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        className="border-x-0 border-t-0 border-b rounded-none px-0 focus-visible:ring-0 text-lg font-medium"
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

                                                <div className="grid grid-cols-2 gap-12">
                                                    <FormField
                                                        control={form.control as any}
                                                        name="enableLeaderboard"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-6">
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value}
                                                                        onCheckedChange={field.onChange}
                                                                        className="h-5 w-5 rounded-none"
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-semibold text-base cursor-pointer">Enable leader board</FormLabel>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control as any}
                                                        name="leaderboardEntries"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col">
                                                                <FormLabel className={cn("text-xs uppercase tracking-wider font-bold mb-1", !form.watch("enableLeaderboard") ? "text-muted-foreground/40" : "text-muted-foreground")}>Default # of entries</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        className="border-x-0 border-t-0 border-b rounded-none px-0 focus-visible:ring-0 text-lg font-medium"
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
                                        </section>

                                        <Separator />

                                        <section className="space-y-6">
                                            <h4 className="font-bold text-lg">Assistance</h4>
                                            <FormField
                                                control={form.control as any}
                                                name="enableAiAssistance"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                                className="h-5 w-5 rounded-none"
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="font-semibold text-base cursor-pointer">Enable Socratic AI assistance</FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                        </section>
                                    </form>
                                </Form>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Footer */}
                <div className="bg-muted px-6 py-4 flex items-center justify-end gap-4 border-t shadow-sm">
                    <Button
                        variant="outline"
                        onClick={() => reset()}
                        className="rounded-none px-8 h-10 font-bold border-primary/20"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={step === 1 && !selectedType}
                        className="rounded-none px-12 h-10 transition-all font-bold"
                    >
                        {step === 1 ? "Next" : "Create Assignment"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
