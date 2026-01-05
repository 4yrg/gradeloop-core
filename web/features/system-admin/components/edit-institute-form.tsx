"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "../../../components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../../../components/ui/form"
import { Input } from "../../../components/ui/input"
import { useInstitute, useUpdateInstitute } from "../../../hooks/institute"
import { useSystemAdminStore } from "../store/use-system-admin-store"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const editInstituteSchema = z.object({
    name: z.string().min(2, "Institute name must be at least 2 characters"),
    domain: z.string().min(3, "Domain must be at least 3 characters"),
    contactEmail: z.string().email("Invalid contact email"),
})

type EditInstituteFormValues = z.infer<typeof editInstituteSchema>

interface EditInstituteFormProps {
    instituteId: string
}

export function EditInstituteForm({ instituteId }: EditInstituteFormProps) {
    const { data: institute, isLoading } = useInstitute(instituteId)
    const updateInstitute = useUpdateInstitute()
    const setEditModalOpen = useSystemAdminStore((state) => state.setEditModalOpen)

    const form = useForm<EditInstituteFormValues>({
        resolver: zodResolver(editInstituteSchema),
        defaultValues: {
            name: "",
            domain: "",
            contactEmail: "",
        },
    })

    // Update form when institute data is loaded
    useEffect(() => {
        if (institute) {
            form.reset({
                name: institute.name,
                domain: institute.domain,
                contactEmail: institute.contactEmail,
            })
        }
    }, [institute, form])

    const onSubmit = async (data: EditInstituteFormValues) => {
        try {
            await updateInstitute.mutateAsync({
                id: instituteId,
                data,
            })
            toast.success("Institute updated successfully")
            setEditModalOpen(false)
        } catch (error) {
            toast.error("Failed to update institute. Please try again.")
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!institute) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Institute not found.
            </div>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Institute Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Massachusetts Institute of Technology" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormItem>
                        <FormLabel>Institute Code</FormLabel>
                        <FormControl>
                            <Input value={institute.code} disabled className="bg-muted" />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Code cannot be changed</p>
                    </FormItem>

                    <FormField
                        control={form.control}
                        name="domain"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Domain</FormLabel>
                                <FormControl>
                                    <Input placeholder="mit.edu" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contact Email</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="contact@mit.edu" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditModalOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={updateInstitute.isPending}>
                        {updateInstitute.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            "Update Institute"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
