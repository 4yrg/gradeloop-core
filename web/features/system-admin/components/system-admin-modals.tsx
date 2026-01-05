"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "../../../components/ui/dialog"
import { CreateInstituteForm } from "./create-institute-form"
import { InstituteDetailsView } from "./institute-details-view"
import { useSystemAdminStore } from "../store/use-system-admin-store"

export function SystemAdminModals() {
    const {
        isCreateModalOpen,
        setCreateModalOpen,
        isDetailsModalOpen,
        setDetailsModalOpen,
        selectedInstituteId,
        setSelectedInstituteId
    } = useSystemAdminStore()

    return (
        <>
            {/* Create Institute Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create Institute</DialogTitle>
                    </DialogHeader>
                    <CreateInstituteForm />
                </DialogContent>
            </Dialog>

            {/* Institute Details Modal */}
            <Dialog
                open={isDetailsModalOpen}
                onOpenChange={(open) => {
                    setDetailsModalOpen(open)
                    if (!open) setSelectedInstituteId(null)
                }}
            >
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    {selectedInstituteId ? (
                        <InstituteDetailsView instituteId={selectedInstituteId} />
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            No institute selected.
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
