"use client";

import { use, useState } from "react";
import {
    ArrowRight,
    BookOpen,
    Calendar,
    CheckCircle2,
    Clock,
    GraduationCap,
    MessageSquare,
    Trophy
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Progress } from "../../../../../components/ui/progress";
import { Badge } from "../../../../../components/ui/badge";
import { MOCK_ASSIGNMENTS } from "../../../../../features/student/assignments/data/mock-assignments";
import { AssignmentDetailsDialog } from "../../../../../features/student/assignments/components/assignment-details-dialog";

export default function StudentCourseOverviewPage({
    params
}: {
    params: Promise<{ courseId: string }>
}) {
    const { courseId } = use(params);
    const [detailsOpen, setDetailsOpen] = useState(false);

    // In a real app, fetch course details and assignments for this student
    const nextAssignment = MOCK_ASSIGNMENTS[0];

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-6xl mx-auto w-full px-4">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider font-medium">
                    <span>2025 Semester 1</span>
                    <span>•</span>
                    <span>Computer Science</span>
                    <span>•</span>
                    <span className="font-bold text-primary">{courseId}</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight">Introduction to Programming</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Master the fundamentals of procedural and object-oriented programming using modern software development practices.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    {/* Featured / Next Assignment */}
                    <Card className="border-2 border-primary/20 bg-primary/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4">
                            <Badge className="bg-primary/20 text-primary hover:bg-primary/20 border-primary/20">Up Next</Badge>
                        </div>
                        <CardHeader>
                            <CardTitle className="text-2xl">{nextAssignment.title}</CardTitle>
                            <CardDescription>Deadline approaching in 2 days</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(nextAssignment.dueDate).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    {nextAssignment.attemptsRemaining} attempts left
                                </div>
                            </div>
                            <Button className="shadow-lg shadow-primary/20" onClick={() => setDetailsOpen(true)}>
                                Continue Work
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Recent Announcements */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            Latest Announcements
                        </h2>
                        <div className="space-y-3">
                            {[
                                { title: "Midterm Exam Date Fixed", date: "Jan 03", desc: "The midterm will be held on Feb 15 in Hall B." },
                                { title: "Lab 3 Solutions Released", date: "Dec 30", desc: "You can find the sample solutions in the resources tab." },
                            ].map((ann, i) => (
                                <div key={i} className="p-4 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-sm group-hover:text-primary transition-colors">{ann.title}</span>
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground">{ann.date}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{ann.desc}</p>
                                </div>
                            ))}
                            <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                                View All Announcements
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Progress Card */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-amber-500" />
                                Your Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    <span>Assignments</span>
                                    <span>4 / 6</span>
                                </div>
                                <Progress value={66} className="h-2" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 rounded-lg bg-muted/30 border">
                                    <p className="text-2xl font-black text-primary">82</p>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Current Avg</p>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-muted/30 border">
                                    <p className="text-2xl font-black text-primary">A-</p>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Forecast</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Links */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Quick Links</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {[
                                { label: "My Submissions", icon: GraduationCap, href: `/student/courses/${courseId}/assignments` },
                                { label: "Course Resources", icon: BookOpen, href: "#" },
                                { label: "Contact Instructor", icon: MessageSquare, href: "/student/support" },
                            ].map((link, i) => (
                                <Link key={i} href={link.href} className="flex items-center gap-3 px-6 py-3 hover:bg-muted transition-colors border-t first:border-t-0">
                                    <link.icon className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium">{link.label}</span>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AssignmentDetailsDialog
                assignment={nextAssignment}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
            />
        </div>
    );
}
