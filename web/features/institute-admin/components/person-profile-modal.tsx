"use client";

import { Person } from "../types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, User, Fingerprint } from "lucide-react";

interface PersonProfileModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    person: Person | null;
}

export function PersonProfileModal({
    open,
    onOpenChange,
    person,
}: PersonProfileModalProps) {
    if (!person) return null;

    const initials = `${person.firstName?.[0] || ""}${person.lastName?.[0] || ""}`.toUpperCase();

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'institute_admin': return 'destructive';
            case 'instructor': return 'default';
            default: return 'secondary';
        }
    };

    const formatRole = (role: string) => {
        return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader className="flex flex-col items-center text-center space-y-4">
                    <Avatar className="h-24 w-24 border-4 border-muted">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${person.firstName} ${person.lastName}`} />
                        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <DialogTitle className="text-2xl font-bold">
                            {person.firstName} {person.lastName}
                        </DialogTitle>
                        <Badge variant={getRoleBadgeVariant(person.role)}>
                            {formatRole(person.role)}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex items-center gap-4 px-2">
                        <div className="p-2 bg-primary/10 rounded-full text-primary">
                            <Mail className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Address</p>
                            <p className="text-sm font-semibold">{person.email}</p>
                        </div>
                    </div>

                    {person.studentId && (
                        <div className="flex items-center gap-4 px-2">
                            <div className="p-2 bg-primary/10 rounded-full text-primary">
                                <Fingerprint className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Student ID</p>
                                <p className="text-sm font-semibold">{person.studentId}</p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
