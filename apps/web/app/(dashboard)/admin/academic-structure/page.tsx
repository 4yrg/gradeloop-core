"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AdminService, AcademicNode } from "@/services/admin.service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AcademicTree } from "@/components/admin/AcademicTree"
import { Plus, Download, Upload, RefreshCw, Loader2 } from "lucide-react"
import { AcademicNodeDialog } from "@/components/admin/AcademicNodeDialog"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function AcademicStructurePage() {
    const queryClient = useQueryClient()
    const { data: structure, isLoading } = useQuery({
        queryKey: ['academic-structure'],
        queryFn: AdminService.getAcademicStructure
    })

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
    const [selectedNode, setSelectedNode] = useState<AcademicNode | null>(null)
    const [parentNode, setParentNode] = useState<AcademicNode | null>(null)

    // Delete State
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [nodeToDelete, setNodeToDelete] = useState<AcademicNode | null>(null)

    // Mutations
    const addMutation = useMutation({
        mutationFn: (data: { parentId: string | null, node: any }) => AdminService.addNode(data.parentId, data.node),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-structure'] })
            toast.success("Academic unit added successfully")
        }
    })

    const updateMutation = useMutation({
        mutationFn: (data: { id: string, updates: any }) => AdminService.updateNode(data.id, data.updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-structure'] })
            toast.success("Academic unit updated successfully")
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => AdminService.deleteNode(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-structure'] })
            toast.success("Academic unit removed successfully")
            setDeleteOpen(false)
        }
    })

    // Handlers
    const handleAddRoot = () => {
        setDialogMode('add')
        setParentNode(null)
        setSelectedNode(null)
        setDialogOpen(true)
    }

    const handleAddChild = (parent: AcademicNode) => {
        setDialogMode('add')
        setParentNode(parent)
        setSelectedNode(null)
        setDialogOpen(true)
    }

    const handleEdit = (node: AcademicNode) => {
        setDialogMode('edit')
        setSelectedNode(node)
        setDialogOpen(true)
    }

    const handleDeleteClick = (node: AcademicNode) => {
        setNodeToDelete(node)
        setDeleteOpen(true)
    }

    const handleSave = async (data: Partial<AcademicNode>) => {
        if (dialogMode === 'add') {
            await addMutation.mutateAsync({
                parentId: parentNode?.id || null,
                node: { ...data, children: [] }
            })
        } else if (dialogMode === 'edit' && selectedNode) {
            await updateMutation.mutateAsync({
                id: selectedNode.id,
                updates: data
            })
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Academic Structure</h1>
                    <p className="text-muted-foreground">Manage faculties, degrees, batches, and classes hierarchy.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import</Button>
                    <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export</Button>
                    <Button onClick={handleAddRoot}><Plus className="mr-2 h-4 w-4" /> Add Root Unit</Button>
                </div>
            </div>

            <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Hierarchy Editor</CardTitle>
                            <CardDescription>
                                Defines the structure of the institution. Changes here affect global navigation and course availability.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <AcademicTree
                                    data={structure || []}
                                    onAddNode={handleAddChild}
                                    onEditNode={handleEdit}
                                    onDeleteNode={handleDeleteClick}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm">
                                <h4 className="font-semibold text-yellow-800 dark:text-yellow-500 mb-1">Structure Locked</h4>
                                <p className="text-yellow-700 dark:text-yellow-600">
                                    Major structural changes are disabled during active academic terms. Contact IT Support for urgent modifications.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Statistics</h4>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Faculties</span>
                                    <span className="font-mono">2</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Degree Programs</span>
                                    <span className="font-mono">5</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Active Classes</span>
                                    <span className="font-mono">28</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AcademicNodeDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                mode={dialogMode}
                parentNode={parentNode}
                node={selectedNode}
                onSave={handleSave}
            />

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete
                            <span className="font-semibold text-foreground"> {nodeToDelete?.name} </span>
                            and all of its children (degrees, years, classes, etc.).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => nodeToDelete && deleteMutation.mutate(nodeToDelete.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
