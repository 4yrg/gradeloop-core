'use client';

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useRoster } from "../../../../../../hooks/use-roster";
import { mockAssignments, mockCourse } from "../../../../../../lib/mock-data";
import { Button } from "../../../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../components/ui/card";
import { Label } from "../../../../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../../../components/ui/tabs";
import { Input } from "../../../../../../components/ui/input";
import { ArrowLeft, Calendar as CalendarIcon, Clock, Users, User, LayoutGrid, CheckCircle2 } from "lucide-react";
import { Separator } from "../../../../../../components/ui/separator";
import { Badge } from "../../../../../../components/ui/badge";
import { ScrollArea } from "../../../../../../components/ui/scroll-area";
import { Checkbox } from "../../../../../../components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../../components/ui/popover";
import { Calendar } from "../../../../../../components/ui/calendar";
import { format } from "date-fns";
import { cn } from "../../../../../../lib/utils";

export default function ExtensionPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;
    const { data: rosterData } = useRoster(courseId);

    const [selectedAssignment, setSelectedAssignment] = useState<string>("");
    const [scope, setScope] = useState<string>("class");
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [date, setDate] = useState<Date>();
    const [time, setTime] = useState<string>("23:59");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleGrantExtension = () => {
        setIsSubmitted(true);
        setTimeout(() => setIsSubmitted(false), 3000);
    };

    const toggleStudent = (id: string) => {
        setSelectedStudents(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    return (
        <div className="flex flex-col gap-6 pb-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 hover:bg-transparent text-muted-foreground"
                            onClick={() => router.push(`/instructor/courses/${courseId}`)}
                        >
                            <ArrowLeft className="mr-2 h-3 w-3" />
                            Back to Course
                        </Button>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Assignment Extensions</h2>
                    <p className="text-muted-foreground text-sm uppercase tracking-wider font-medium">
                        {mockCourse.code} • {mockCourse.name}
                    </p>
                </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Grant New Extension</CardTitle>
                            <CardDescription>
                                Set a custom deadline for specific students or the entire class.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="assignment">Select Assignment</Label>
                                <Select onValueChange={setSelectedAssignment} value={selectedAssignment}>
                                    <SelectTrigger id="assignment">
                                        <SelectValue placeholder="Choose an assignment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {mockAssignments.map(a => (
                                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Extension Scope</Label>
                                <Tabs value={scope} onValueChange={setScope} className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="class" className="flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            Entire Class
                                        </TabsTrigger>
                                        <TabsTrigger value="students" className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Individuals
                                        </TabsTrigger>
                                    </TabsList>

                                    <div className="mt-4 border rounded-md p-4 bg-muted/20">
                                        <TabsContent value="class" className="mt-0 space-y-2">
                                            <p className="text-sm text-muted-foreground">
                                                This extension will apply to all 120 students enrolled in this course.
                                            </p>
                                        </TabsContent>

                                        <TabsContent value="students" className="mt-0 space-y-4">
                                            <Label className="text-xs uppercase font-bold text-muted-foreground">Select Students</Label>
                                            <ScrollArea className="h-[200px] pr-4">
                                                <div className="space-y-3">
                                                    {rosterData?.students.map(student => (
                                                        <div key={student.id} className="flex items-center space-x-2 pb-2 border-b border-border/50 last:border-0">
                                                            <Checkbox
                                                                id={student.id}
                                                                checked={selectedStudents.includes(student.id)}
                                                                onCheckedChange={() => toggleStudent(student.id)}
                                                            />
                                                            <div className="flex flex-col">
                                                                <label htmlFor={student.id} className="text-sm font-medium leading-none cursor-pointer">
                                                                    {student.name}
                                                                </label>
                                                                <span className="text-xs text-muted-foreground">{student.email}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-2">
                                    <Label>New Due Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !date && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={setDate}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="time">Due Time</Label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="time"
                                            type="time"
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                className="w-full mt-6"
                                size="lg"
                                disabled={!selectedAssignment || !date || (scope === 'students' && selectedStudents.length === 0)}
                                onClick={handleGrantExtension}
                            >
                                {isSubmitted ? (
                                    <>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Extension Granted
                                    </>
                                ) : (
                                    "Grant Extension"
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Extensions</CardTitle>
                            <CardDescription>Last granted extensions for this course.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="p-4 space-y-2 transition-colors hover:bg-muted/30">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold">SQL Lab</span>
                                            <Badge variant="secondary" className="text-[10px] h-5">Granted</Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <User className="h-3 w-3" />
                                            <span>{i === 1 ? "Entire Class" : `Student ${i * 7}`}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-medium text-amber-600">
                                            <Clock className="h-3 w-3" />
                                            <span>Until: Oct 18, 2023 23:59</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Extension Policy</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Granting an extension overrides the original assignment deadline for the selected participants.
                                Students will receive a notification and the new deadline will reflect on their activity feed.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
