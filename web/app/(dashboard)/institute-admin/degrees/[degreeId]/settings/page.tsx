"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Trash2, AlertTriangle, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import { degreesService } from "@/features/institute-admin/api/degrees-service";
import { degreeSchema } from "@/features/institute-admin/types";

export default function DegreeSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const degreeId = params.degreeId as string;

    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const form = useForm<z.infer<typeof degreeSchema>>({
        resolver: zodResolver(degreeSchema),
        defaultValues: {
            name: "",
            code: "",
            description: "",
            requiredCredits: 0,
        },
    });

    useEffect(() => {
        if (degreeId) {
            loadDegree();
        }
    }, [degreeId]);

    const loadDegree = async () => {
        try {
            setLoading(true);
            const degree = await degreesService.getDegreeById(degreeId);
            if (degree) {
                form.reset(degree);
            } else {
                // Handle not found
            }
        } catch (error) {
            console.error("Failed to load degree", error);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: z.infer<typeof degreeSchema>) => {
        try {
            await degreesService.updateDegree(degreeId, data);
            alert("Degree updated successfully"); // Simple feedback
        } catch (error) {
            console.error("Failed to update degree", error);
        }
    };

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await degreesService.deleteDegree(degreeId);
            router.push("/institute-admin/degrees");
        } catch (error) {
            console.error("Failed to delete degree", error);
            setIsDeleting(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
    }

    return (
        <div className="max-w-2xl space-y-8 mx-auto">
            <div>
                <h2 className="text-xl font-bold tracking-tight">Degree Settings</h2>
                <p className="text-muted-foreground">Update degree details or remove the degree.</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Degree Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Bachelor of Science in..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Degree Code</FormLabel>
                                    <FormControl>
                                        <Input placeholder="BS-CS" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="requiredCredits"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Required Credits</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Program details..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Form>

            <Separator className="my-6" />

            <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <h3 className="font-medium text-destructive flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Danger Zone
                        </h3>
                        <p className="text-sm text-destructive/80">
                            Deleting this degree will permanently remove it and all associated classes and course mappings.
                        </p>
                    </div>
                    <Button
                        variant="destructive"
                        onClick={() => setDeleteDialogOpen(true)}
                    >
                        Delete Degree
                    </Button>
                </div>
            </div>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete <strong>{form.getValues("name")}</strong> and remove data from our servers.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? "Deleting..." : "Yes, delete degree"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
