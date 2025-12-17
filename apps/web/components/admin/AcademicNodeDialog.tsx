"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AcademicNode, AcademicNodeType } from "@/services/admin.service"

interface AcademicNodeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: 'add' | 'edit'
    parentNode: AcademicNode | null // For 'add' mode
    node: AcademicNode | null // For 'edit' mode
    onSave: (nodeData: Partial<AcademicNode>) => void
}

const NODE_TYPES: { value: AcademicNodeType, label: string }[] = [
    { value: 'faculty', label: 'Faculty' },
    { value: 'degree', label: 'Degree Program' },
    { value: 'year', label: 'Year' },
    { value: 'semester', label: 'Semester' },
    { value: 'specialization', label: 'Specialization' },
    { value: 'batch', label: 'Batch' },
    { value: 'class', label: 'Class / Module' },
]

export function AcademicNodeDialog({
    open,
    onOpenChange,
    mode,
    parentNode,
    node,
    onSave
}: AcademicNodeDialogProps) {
    const [name, setName] = useState("")
    const [type, setType] = useState<AcademicNodeType>('faculty')

    useEffect(() => {
        if (mode === 'edit' && node) {
            setName(node.name)
            setType(node.type)
        } else if (mode === 'add') {
            setName("")
            // Intelligent default based on parent
            if (parentNode) {
                switch (parentNode.type) {
                    case 'faculty': setType('degree'); break;
                    case 'degree': setType('year'); break;
                    case 'year': setType('semester'); break;
                    case 'semester': setType('batch'); break; // or specialization
                    case 'specialization': setType('batch'); break;
                    case 'batch': setType('class'); break;
                    default: setType('class');
                }
            } else {
                setType('faculty')
            }
        }
    }, [open, mode, node, parentNode])

    const handleSave = () => {
        onSave({ name, type })
        onOpenChange(false)
    }

    const title = mode === 'add' ? 'Add Academic Unit' : 'Edit Academic Unit'
    const description = mode === 'add'
        ? `Add a new unit under ${parentNode?.name || 'the root level'}.`
        : `Update details for ${node?.name}.`

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            placeholder="e.g. Faculty of Computing"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">
                            Type
                        </Label>
                        <Select
                            value={type}
                            onValueChange={(val) => setType(val as AcademicNodeType)}
                            disabled={mode === 'edit'} // Usually we don't change type of existing node
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                {NODE_TYPES.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
