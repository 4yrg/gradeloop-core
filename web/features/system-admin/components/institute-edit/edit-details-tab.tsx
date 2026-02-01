"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../../../../components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../../components/ui/form";
import { Input } from "../../../../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { useUpdateInstitute } from "../../../../hooks/institute";
import { useSystemAdminStore } from "../../store/use-system-admin-store";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Institute } from "../../types";

const editInstituteSchema = z.object({
  name: z.string().min(2, "Institute name must be at least 2 characters"),
  domain: z.string().min(3, "Domain must be at least 3 characters"),
  contactEmail: z.string().email("Invalid contact email"),
});

type EditInstituteFormValues = z.infer<typeof editInstituteSchema>;

interface EditInstituteDetailsTabProps {
  institute: Institute;
}

export function EditInstituteDetailsTab({
  institute,
}: EditInstituteDetailsTabProps) {
  const updateInstitute = useUpdateInstitute();
  const setEditModalOpen = useSystemAdminStore(
    (state) => state.setEditModalOpen
  );

  const form = useForm<EditInstituteFormValues>({
    resolver: zodResolver(editInstituteSchema),
    defaultValues: {
      name: institute.name,
      domain: institute.domain,
      contactEmail: institute.contactEmail,
    },
  });

  // Update form when institute data changes
  useEffect(() => {
    form.reset({
      name: institute.name,
      domain: institute.domain,
      contactEmail: institute.contactEmail,
    });
  }, [institute, form]);

  const onSubmit = async (data: EditInstituteFormValues) => {
    try {
      await updateInstitute.mutateAsync({
        id: institute.id!,
        data,
      });
      toast.success("Institute updated successfully");
      setEditModalOpen(false);
    } catch (error) {
      console.error("Failed to update institute:", error);
      toast.error("Failed to update institute. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Institute Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                institute.status === "active"
                  ? "secondary"
                  : institute.status === "inactive"
                  ? "destructive"
                  : "secondary"
              }
              className="capitalize"
            >
              {institute.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Institute Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{institute.code}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cannot be changed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Administrators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{institute.admins.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active administrators
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Institute Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institute Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Massachusetts Institute of Technology"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="contact@mit.edu"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateInstitute.isPending}>
                  {updateInstitute.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Institute
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
