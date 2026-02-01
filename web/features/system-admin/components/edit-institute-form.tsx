"use client";

import { useInstitute } from "../../../hooks/institute/useInstitutes";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import { Skeleton } from "../../../components/ui/skeleton";
import { EditInstituteDetailsTab } from "./institute-edit/edit-details-tab";
import { AdminsTab } from "./institute-details/admins-tab";
import { Button } from "../../../components/ui/button";
import { X } from "lucide-react";
import { useSystemAdminStore } from "../store/use-system-admin-store";

interface EditInstituteFormProps {
  instituteId: string;
}

export function EditInstituteForm({ instituteId }: EditInstituteFormProps) {
  const { data: institute, isLoading, refetch } = useInstitute(instituteId);
  const setEditModalOpen = useSystemAdminStore(
    (state) => state.setEditModalOpen
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-75 w-full" />
      </div>
    );
  }

  if (!institute) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Institute not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Edit {institute.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage institute details and administrators
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setEditModalOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Institute Details</TabsTrigger>
          <TabsTrigger value="admins">Administrators</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <EditInstituteDetailsTab institute={institute} />
        </TabsContent>
        <TabsContent value="admins">
          <AdminsTab
            admins={institute.admins}
            instituteId={institute.id!}
            onRefresh={refetch}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
