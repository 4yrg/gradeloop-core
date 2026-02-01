import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../../components/ui/alert-dialog";
import { InstituteAdmin } from "../../types";
import { Mail, ShieldCheck, UserMinus, Loader2 } from "lucide-react";
import { AddAdminDialog } from "./add-admin-dialog";
import { useRemoveAdmin } from "../../../../hooks/institute/useRemoveAdmin";
import { useResendAdminInvite } from "../../../../hooks/institute/useResendAdminInvite";
import { toast } from "sonner";

interface AdminsTabProps {
  admins: InstituteAdmin[];
  instituteId: string; // Need this ID
  onRefresh?: () => void;
}

export function AdminsTab({ admins, instituteId, onRefresh }: AdminsTabProps) {
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<InstituteAdmin | null>(
    null
  );

  const removeAdmin = useRemoveAdmin();
  const resendInvite = useResendAdminInvite();

  const handleRemoveClick = (admin: InstituteAdmin) => {
    setAdminToDelete(admin);
    setDeleteDialogOpen(true);
  };

  const handleRemoveConfirm = async () => {
    if (!adminToDelete?.id) return;
    try {
      await removeAdmin.mutateAsync({
        instituteId,
        adminId: adminToDelete.id,
      });
      toast.success("Admin removed successfully");
      setDeleteDialogOpen(false);
      setAdminToDelete(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Failed to remove admin:", error);
      toast.error("Failed to remove admin");
    }
  };

  const handleResendInvite = async (admin: InstituteAdmin) => {
    if (!admin.id) return;
    try {
      await resendInvite.mutateAsync({
        instituteId,
        adminId: admin.id,
      });
      toast.success(`Invitation resent to ${admin.email}`);
    } catch (error: unknown) {
      console.error("Failed to resend invitation:", error);

      // Check for specific error messages
      const errorMessage = (
        error as { response?: { data?: { error?: string } } }
      )?.response?.data?.error;
      if (errorMessage === "admin has already activated their account") {
        toast.error(`${admin.name} has already activated their account`);
      } else {
        toast.error("Failed to resend invitation");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Institute Administrators</h3>
        <Button size="sm" onClick={() => setIsAddAdminOpen(true)}>
          Add Admin
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admin Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell className="font-medium">{admin.name}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {admin.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Resend Invite"
                    onClick={() => handleResendInvite(admin)}
                    disabled={resendInvite.isPending}
                  >
                    {resendInvite.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    title="Remove Admin"
                    onClick={() => handleRemoveClick(admin)}
                    disabled={removeAdmin.isPending}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AddAdminDialog
        open={isAddAdminOpen}
        onOpenChange={setIsAddAdminOpen}
        instituteId={instituteId}
        onSuccess={() => {
          // Refresh or optimistic update
          if (onRefresh) onRefresh();
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Administrator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{adminToDelete?.name}</strong> as an administrator? This
              action cannot be undone and they will lose access to manage this
              institute.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removeAdmin.isPending}
            >
              {removeAdmin.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Admin"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
