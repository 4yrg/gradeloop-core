"use client";

import { use } from "react";
import Link from "next/link";
import { useState } from "react";
import {
    ArrowLeft,
    Save,
    Settings,
    Zap,
    MessageSquare,
    Brain,
    Users,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Info
} from "lucide-react";
import { Button } from "../../../../../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../../components/ui/card";
import { Label } from "../../../../../../../../../components/ui/label";
import { Switch } from "../../../../../../../../../components/ui/switch";
import { Slider } from "../../../../../../../../../components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../../../components/ui/select";
import { Input } from "../../../../../../../../../components/ui/input";
import { RadioGroup, RadioGroupItem } from "../../../../../../../../../components/ui/radio-group";
import { Checkbox } from "../../../../../../../../../components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../../../../../../../components/ui/collapsible";
import { Badge } from "../../../../../../../../../components/ui/badge";
import { Separator } from "../../../../../../../../../components/ui/separator";
import { Alert, AlertDescription } from "../../../../../../../../../components/ui/alert";

// Mock current configuration
const mockConfig = {
    basic: {
        enabled: true,
        weight: 25,
        passingThreshold: 70,
        maxAttempts: 3,
        timeLimit: 15
    },
    trigger: {
        type: "automatic",
        cipasEnabled: true,
        cipasThreshold: 75,
        triggerEvents: ["paste_detection", "external_tools"]
    },
    questions: {
        count: 7,
        adaptation: "irt",
        generation: "hybrid"
    },
    voice: {
        ttsVoice: "alloy",
        speechSpeed: 1.0,
        asrSensitivity: 0.8
    },
    competency: {
        priorProbability: 0.3,
        earlyTermination: true
    },
    experience: {
        allowPractice: true,
        showTranscription: true,
        showQuestionNumbers: true,
        allowPausing: false
    },
    review: {
        instructorReview: false,
        resultsVisibility: "immediate",
        allowContests: true
    }
};

function SettingsSection({
    title,
    description,
    icon: Icon,
    children,
    defaultOpen = true
}: {
    title: string;
    description: string;
    icon: any;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Card>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Icon className="h-5 w-5" />
                                {title}
                            </div>
                            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{description}</p>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="space-y-6">
                        {children}
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}

export default function VivaConfigurePage({
    params
}: {
    params: Promise<{ id: string; assignmentId: string }>
}) {
    const { id: courseId, assignmentId } = use(params);
    const [config, setConfig] = useState(mockConfig);

    const updateConfig = (section: string, field: string, value: any) => {
        setConfig(prev => ({
            ...prev,
            [section]: {
                ...prev[section as keyof typeof prev],
                [field]: value
            }
        }));
    };

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-4xl mx-auto w-full px-4 pt-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Button variant="ghost" asChild className="w-fit -ml-2 text-muted-foreground hover:text-foreground">
                    <Link href={`/instructor/courses/${courseId}/assignments/${assignmentId}/viva-voce`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Viva Dashboard
                    </Link>
                </Button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Viva Configuration</h1>
                        <p className="text-muted-foreground mt-1">
                            Configure automated viva assessment settings for this assignment.
                        </p>
                    </div>
                    <Button className="gap-2">
                        <Save className="h-4 w-4" />
                        Save Configuration
                    </Button>
                </div>
            </div>

            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Changes to viva configuration will only affect future viva sessions. Existing sessions will continue with their current settings.
                </AlertDescription>
            </Alert>

            {/* 1. Basic Settings */}
            <SettingsSection
                title="Basic Settings"
                description="Core viva assessment parameters and grading integration"
                icon={Settings}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Enable Viva Assessment</Label>
                                <p className="text-sm text-muted-foreground">Allow students to take viva evaluations</p>
                            </div>
                            <Switch
                                checked={config.basic.enabled}
                                onCheckedChange={(checked) => updateConfig('basic', 'enabled', checked)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Viva Weight in Grade ({config.basic.weight}%)</Label>
                            <Slider
                                value={[config.basic.weight]}
                                onValueChange={([value]) => updateConfig('basic', 'weight', value)}
                                max={100}
                                step={5}
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Passing Threshold ({config.basic.passingThreshold}%)</Label>
                            <Slider
                                value={[config.basic.passingThreshold]}
                                onValueChange={([value]) => updateConfig('basic', 'passingThreshold', value)}
                                max={100}
                                step={5}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Maximum Attempts</Label>
                            <Select
                                value={config.basic.maxAttempts.toString()}
                                onValueChange={(value) => updateConfig('basic', 'maxAttempts', parseInt(value))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 attempt</SelectItem>
                                    <SelectItem value="2">2 attempts</SelectItem>
                                    <SelectItem value="3">3 attempts</SelectItem>
                                    <SelectItem value="5">5 attempts</SelectItem>
                                    <SelectItem value="0">Unlimited</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Time Limit per Viva ({config.basic.timeLimit} minutes)</Label>
                            <Slider
                                value={[config.basic.timeLimit]}
                                onValueChange={([value]) => updateConfig('basic', 'timeLimit', value)}
                                min={5}
                                max={45}
                                step={5}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
            </SettingsSection>

            {/* 2. Trigger Settings */}
            <SettingsSection
                title="Trigger Settings"
                description="When and how viva assessments should be initiated"
                icon={Zap}
            >
                <div className="space-y-6">
                    <div className="space-y-4">
                        <Label className="text-base">Viva Trigger Method</Label>
                        <RadioGroup
                            value={config.trigger.type}
                            onValueChange={(value) => updateConfig('trigger', 'type', value)}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="manual" id="manual" />
                                <Label htmlFor="manual">Manual trigger by instructor</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="automatic" id="automatic" />
                                <Label htmlFor="automatic">Automatic after submission</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="behavior" id="behavior" />
                                <Label htmlFor="behavior">Lab behavior-based trigger (CIPAS integration)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="deadline" id="deadline" />
                                <Label htmlFor="deadline">Deadline-based (e.g., 24hrs before due date)</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {config.trigger.type === 'behavior' && (
                        <div className="border rounded-lg p-4 space-y-4">
                            <h4 className="font-medium">CIPAS Integration Settings</h4>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Enable CIPAS Integration</Label>
                                    <p className="text-sm text-muted-foreground">Trigger viva based on suspicious lab behavior</p>
                                </div>
                                <Switch
                                    checked={config.trigger.cipasEnabled}
                                    onCheckedChange={(checked) => updateConfig('trigger', 'cipasEnabled', checked)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Suspicious Behavior Threshold ({config.trigger.cipasThreshold}%)</Label>
                                <Slider
                                    value={[config.trigger.cipasThreshold]}
                                    onValueChange={([value]) => updateConfig('trigger', 'cipasThreshold', value)}
                                    max={100}
                                    step={5}
                                    className="w-full"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label>Trigger Events</Label>
                                <div className="space-y-2">
                                    {[
                                        { id: 'paste_detection', label: 'Paste detection' },
                                        { id: 'external_tools', label: 'External tool usage' },
                                        { id: 'rapid_typing', label: 'Unusually rapid typing' },
                                        { id: 'copy_paste', label: 'Large copy-paste operations' }
                                    ].map((event) => (
                                        <div key={event.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={event.id}
                                                checked={config.trigger.triggerEvents.includes(event.id)}
                                                onCheckedChange={(checked) => {
                                                    const events = checked
                                                        ? [...config.trigger.triggerEvents, event.id]
                                                        : config.trigger.triggerEvents.filter(e => e !== event.id);
                                                    updateConfig('trigger', 'triggerEvents', events);
                                                }}
                                            />
                                            <Label htmlFor={event.id}>{event.label}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </SettingsSection>

            {/* 3. Question Strategy */}
            <SettingsSection
                title="Question Strategy"
                description="How questions are selected and difficulty is managed"
                icon={Brain}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Number of Questions per Viva</Label>
                            <Select
                                value={config.questions.count.toString()}
                                onValueChange={(value) => updateConfig('questions', 'count', parseInt(value))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[3, 5, 7, 10, 12, 15].map(num => (
                                        <SelectItem key={num} value={num.toString()}>{num} questions</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Difficulty Adaptation Method</Label>
                            <Select
                                value={config.questions.adaptation}
                                onValueChange={(value) => updateConfig('questions', 'adaptation', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="irt">IRT-based (adaptive difficulty)</SelectItem>
                                    <SelectItem value="fixed">Fixed difficulty progression</SelectItem>
                                    <SelectItem value="random">Random from question bank</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Question Generation Source</Label>
                            <Select
                                value={config.questions.generation}
                                onValueChange={(value) => updateConfig('questions', 'generation', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">Auto-generate from rubric</SelectItem>
                                    <SelectItem value="bank">Use pre-defined question bank</SelectItem>
                                    <SelectItem value="hybrid">Hybrid approach</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </SettingsSection>

            {/* 4. Voice Settings */}
            <SettingsSection
                title="Voice Settings"
                description="Text-to-speech and speech recognition configuration"
                icon={MessageSquare}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>TTS Voice Selection</Label>
                            <Select
                                value={config.voice.ttsVoice}
                                onValueChange={(value) => updateConfig('voice', 'ttsVoice', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
                                    <SelectItem value="echo">Echo (Male)</SelectItem>
                                    <SelectItem value="fable">Fable (British Male)</SelectItem>
                                    <SelectItem value="onyx">Onyx (Deep Male)</SelectItem>
                                    <SelectItem value="nova">Nova (Young Female)</SelectItem>
                                    <SelectItem value="shimmer">Shimmer (Warm Female)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Speech Speed ({config.voice.speechSpeed}x)</Label>
                            <Slider
                                value={[config.voice.speechSpeed]}
                                onValueChange={([value]) => updateConfig('voice', 'speechSpeed', value)}
                                min={0.5}
                                max={2.0}
                                step={0.1}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>ASR Sensitivity ({Math.round(config.voice.asrSensitivity * 100)}%)</Label>
                            <Slider
                                value={[config.voice.asrSensitivity]}
                                onValueChange={([value]) => updateConfig('voice', 'asrSensitivity', value)}
                                min={0.1}
                                max={1.0}
                                step={0.1}
                                className="w-full"
                            />
                            <p className="text-xs text-muted-foreground">
                                Higher sensitivity detects softer speech but may increase false positives
                            </p>
                        </div>
                    </div>
                </div>
            </SettingsSection>

            {/* 5. Competency Modeling */}
            <SettingsSection
                title="Competency Modeling"
                description="Advanced settings for knowledge assessment and early termination"
                icon={Brain}
                defaultOpen={false}
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Prior Probability of Mastery ({Math.round(config.competency.priorProbability * 100)}%)</Label>
                        <Slider
                            value={[config.competency.priorProbability]}
                            onValueChange={([value]) => updateConfig('competency', 'priorProbability', value)}
                            min={0.1}
                            max={0.9}
                            step={0.1}
                            className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                            Initial assumption of student knowledge level for each concept
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Early Termination</Label>
                            <p className="text-sm text-muted-foreground">End viva early if mastery is clearly demonstrated or lacking</p>
                        </div>
                        <Switch
                            checked={config.competency.earlyTermination}
                            onCheckedChange={(checked) => updateConfig('competency', 'earlyTermination', checked)}
                        />
                    </div>
                </div>
            </SettingsSection>

            {/* 6. Student Experience */}
            <SettingsSection
                title="Student Experience"
                description="Settings that affect how students interact with the viva system"
                icon={Users}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Allow Practice Mode</Label>
                                <p className="text-sm text-muted-foreground">Let students practice without grading</p>
                            </div>
                            <Switch
                                checked={config.experience.allowPractice}
                                onCheckedChange={(checked) => updateConfig('experience', 'allowPractice', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Show Live Transcription</Label>
                                <p className="text-sm text-muted-foreground">Display real-time speech-to-text</p>
                            </div>
                            <Switch
                                checked={config.experience.showTranscription}
                                onCheckedChange={(checked) => updateConfig('experience', 'showTranscription', checked)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Show Question Numbers</Label>
                                <p className="text-sm text-muted-foreground">Display "Question 3 of 7"</p>
                            </div>
                            <Switch
                                checked={config.experience.showQuestionNumbers}
                                onCheckedChange={(checked) => updateConfig('experience', 'showQuestionNumbers', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Allow Session Pausing</Label>
                                <p className="text-sm text-muted-foreground">Students can pause and resume viva</p>
                            </div>
                            <Switch
                                checked={config.experience.allowPausing}
                                onCheckedChange={(checked) => updateConfig('experience', 'allowPausing', checked)}
                            />
                        </div>
                    </div>
                </div>
            </SettingsSection>

            {/* 7. Review & Feedback */}
            <SettingsSection
                title="Review & Feedback"
                description="Settings for instructor review and student result visibility"
                icon={CheckCircle}
            >
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Instructor Manual Review Required</Label>
                            <p className="text-sm text-muted-foreground">All viva results must be reviewed by instructor before release</p>
                        </div>
                        <Switch
                            checked={config.review.instructorReview}
                            onCheckedChange={(checked) => updateConfig('review', 'instructorReview', checked)}
                        />
                    </div>

                    <div className="space-y-3">
                        <Label>Results Visibility to Students</Label>
                        <RadioGroup
                            value={config.review.resultsVisibility}
                            onValueChange={(value) => updateConfig('review', 'resultsVisibility', value)}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="immediate" id="immediate" />
                                <Label htmlFor="immediate">Show immediately after completion</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="after_review" id="after_review" />
                                <Label htmlFor="after_review">Show only after instructor review</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="never" id="never" />
                                <Label htmlFor="never">Never show detailed results</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Allow Students to Contest Scores</Label>
                            <p className="text-sm text-muted-foreground">Students can request human review of their viva results</p>
                        </div>
                        <Switch
                            checked={config.review.allowContests}
                            onCheckedChange={(checked) => updateConfig('review', 'allowContests', checked)}
                        />
                    </div>
                </div>
            </SettingsSection>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t">
                <Button size="lg" className="gap-2">
                    <Save className="h-4 w-4" />
                    Save Configuration
                </Button>
            </div>
        </div>
    );
}