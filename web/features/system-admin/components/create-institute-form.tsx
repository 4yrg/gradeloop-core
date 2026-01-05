"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { instituteSchema, Institute } from "../types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/ui/form";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Separator } from "../../../components/ui/separator";
import { useSystemAdminStore } from "../store/use-system-admin-store";
import { useCreateInstitute } from "../../../hooks/institute/useCreateInstitute";
import { Trash2, Plus, ArrowLeft, ArrowRight, Check } from "lucide-react";

export function CreateInstituteForm() {
  const { createInstituteStep, setCreateInstituteStep, setCreateModalOpen } =
    useSystemAdminStore();
  const createMutation = useCreateInstitute();

  const form = useForm<Institute>({
    resolver: zodResolver(instituteSchema),
    defaultValues: {
      name: "",
      code: "",
      domain: "",
      contactEmail: "",
      status: "pending",
      setupProgress: 0,
      admins: [{ name: "", email: "", role: "owner" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "admins",
  });

  const onSubmit = (data: Institute) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setCreateModalOpen(false);
        setCreateInstituteStep(1);
        form.reset();
      },
    });
  };

  const nextStep = async () => {
    const fieldsToValidate =
      createInstituteStep === 1
        ? (["name", "code", "domain", "contactEmail"] as const)
        : (["admins"] as const);

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setCreateInstituteStep(createInstituteStep + 1);
  };

  const prevStep = () => setCreateInstituteStep(createInstituteStep - 1);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {createInstituteStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Institute Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institute Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Stanford University"
                        {...field}
                      />
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
                      <FormLabel>Institute Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. STANFORD" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. stanford.edu" {...field} />
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
                      <Input placeholder="admin@institute.edu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {createInstituteStep === 2 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Step 2: Institute Admins</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: "", email: "", role: "admin" })}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Admin
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex gap-4 items-end border p-4 rounded-lg relative"
                >
                  <FormField
                    control={form.control}
                    name={`admins.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`admins.${index}.email`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="john.doe@institute.edu"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`admins.${index}.role`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="admin">Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive mb-1"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {createInstituteStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Review & Submit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <div className="font-semibold">Institute Name</div>
                  <div className="text-muted-foreground">
                    {form.getValues("name")}
                  </div>
                </div>
                <div>
                  <div className="font-semibold">Institute Code</div>
                  <div className="text-muted-foreground">
                    {form.getValues("code")}
                  </div>
                </div>
                <div>
                  <div className="font-semibold">Domain</div>
                  <div className="text-muted-foreground">
                    {form.getValues("domain")}
                  </div>
                </div>
                <div>
                  <div className="font-semibold">Contact Email</div>
                  <div className="text-muted-foreground">
                    {form.getValues("contactEmail")}
                  </div>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="space-y-4">
                <div className="font-semibold text-sm">Admins</div>
                <div className="grid gap-4">
                  {form.getValues("admins").map((admin, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm p-3 border rounded-md"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{admin.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {admin.email}
                        </span>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {admin.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between pt-4">
          {createInstituteStep > 1 && (
            <Button type="button" variant="outline" onClick={prevStep}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
          )}
          <div className="ml-auto">
            {createInstituteStep < 3 ? (
              <Button type="button" onClick={nextStep}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  "Submitting..."
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" /> Create Institute
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
