'use client';

import { useParams, useRouter } from "next/navigation";
import { useRoster } from "@/hooks/use-roster";
import { useRosterStore } from "@/store/use-roster-store";
import { RosterSearch } from "@/components/instructor/roster/roster-search";
import { ParticipantCard } from "@/components/instructor/roster/participant-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, UserX, Users, GraduationCap, ArrowLeft, Settings } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockCourse } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { PersonProfileModal } from "@/features/institute-admin/components/person-profile-modal";
import { Person, UserRole } from "@/features/institute-admin/types";
import { Participant } from "@/types/roster";

export default function RosterPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;
    const { searchQuery } = useRosterStore();

    const { data, isLoading, isError, error } = useRoster(courseId);

    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleParticipantClick = (participant: Participant) => {
        const [firstName, ...lastNameParts] = participant.name.split(" ");
        const lastName = lastNameParts.join(" ") || "";

        const person: Person = {
            id: participant.id,
            firstName,
            lastName,
            email: participant.email,
            role: participant.role.toLowerCase() as UserRole,
            // For students in roster, we don't have studentId in the Participant type yet, 
            // but we can map it if we add it to Participant later.
            studentId: "",
        };

        setSelectedPerson(person);
        setIsModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading roster data...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {error instanceof Error ? error.message : "Failed to load roster participants."}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!data) return null;

    const filteredStudents = data.students.filter(
        (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredInstructors = data.instructors.filter(
        (i) =>
            i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const leadInstructors = filteredInstructors.filter(i => i.instructorRole === 'LEAD');
    const supportingInstructors = filteredInstructors.filter(i => i.instructorRole === 'SUPPORTING');

    return (
        <div className="flex flex-col gap-6 pb-10">
            {/* Header - Similar to institute-admin style */}
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
                    <h2 className="text-3xl font-bold tracking-tight">Module Roster</h2>
                    <p className="text-muted-foreground text-sm uppercase tracking-wider font-medium">
                        {mockCourse.code} • {mockCourse.name}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <RosterSearch />
                    <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Separator />

            <Tabs defaultValue="students" className="space-y-6">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="students" className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            Students
                            <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                                {filteredStudents.length}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="instructors" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Teaching Staff
                            <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                                {data.instructors.length}
                            </span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="instructors" className="space-y-8 animate-in fade-in-50 duration-300">
                    {filteredInstructors.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="flex flex-col gap-10">
                            {leadInstructors.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Lead Instructors</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {leadInstructors.map((instructor) => (
                                            <ParticipantCard
                                                key={instructor.id}
                                                participant={instructor}
                                                onClick={() => handleParticipantClick(instructor)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {supportingInstructors.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Supporting Staff</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {supportingInstructors.map((instructor) => (
                                            <ParticipantCard
                                                key={instructor.id}
                                                participant={instructor}
                                                onClick={() => handleParticipantClick(instructor)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="students" className="space-y-4 animate-in fade-in-50 duration-300">
                    {filteredStudents.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <ScrollArea className="h-[calc(100vh-350px)] w-full rounded-xl border border-dashed p-6 bg-muted/5">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredStudents.map((student) => (
                                    <ParticipantCard
                                        key={student.id}
                                        participant={student}
                                        onClick={() => handleParticipantClick(student)}
                                    />
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </TabsContent>
            </Tabs>

            <PersonProfileModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                person={selectedPerson}
                key={selectedPerson ? selectedPerson.id : 'new'}
            />
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] border border-dashed rounded-xl bg-muted/20">
            <UserX className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No results found</p>
            <p className="text-sm text-muted-foreground">
                Try adjusting your search query.
            </p>
        </div>
    );
}
