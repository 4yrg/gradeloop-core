import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Participant } from "@/types/roster";
import { Star } from "lucide-react";

interface ParticipantCardProps {
    participant: Participant;
}

export function ParticipantCard({ participant }: ParticipantCardProps) {
    const initials = participant.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();

    if (participant.role === 'INSTRUCTOR') {
        const isLead = participant.instructorRole === 'LEAD';
        return (
            <Card className="text-center pt-6 relative group border-2 border-transparent hover:border-primary/20 transition-all">
                {isLead && (
                    <div className="absolute top-2 right-2">
                        <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-white border-0 px-2 py-0">
                            <Star className="w-3 h-3 fill-current mr-1" />
                            Lead
                        </Badge>
                    </div>
                )}
                <CardContent className="space-y-4">
                    <div className="flex justify-center">
                        <Avatar className="h-20 w-20 border-2 border-muted">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${participant.name}`} />
                            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-semibold text-lg leading-tight">{participant.name}</h4>
                        <p className="text-sm text-muted-foreground break-all">{participant.email}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Student style (similar to Class cards)
    return (
        <Card className="relative group overflow-hidden transition-all hover:shadow-md border-l-4 border-l-primary/70">
            <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-10 w-10 border border-muted">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${participant.name}`} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-none truncate">{participant.name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{participant.email}</p>
                </div>
            </CardContent>
        </Card>
    );
}
