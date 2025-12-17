"use client"

import { useState } from "react"
import { AcademicNode } from "@/services/admin.service"
import { ChevronRight, ChevronDown, Folder, GraduationCap, Calendar, Users, Briefcase, BookOpen, Plus, MoreHorizontal, Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface AcademicTreeProps {
    data: AcademicNode[]
    onAddNode?: (parentNode: AcademicNode) => void
    onEditNode?: (node: AcademicNode) => void
    onDeleteNode?: (node: AcademicNode) => void
}

export function AcademicTree({ data, onAddNode, onEditNode, onDeleteNode }: AcademicTreeProps) {
    return (
        <div className="space-y-2">
            {data.map((node) => (
                <TreeNode
                    key={node.id}
                    node={node}
                    level={0}
                    onAddNode={onAddNode}
                    onEditNode={onEditNode}
                    onDeleteNode={onDeleteNode}
                />
            ))}
        </div>
    )
}

interface TreeNodeProps {
    node: AcademicNode
    level: number
    onAddNode?: (parentNode: AcademicNode) => void
    onEditNode?: (node: AcademicNode) => void
    onDeleteNode?: (node: AcademicNode) => void
}

function TreeNode({ node, level, onAddNode, onEditNode, onDeleteNode }: TreeNodeProps) {
    const [isOpen, setIsOpen] = useState(false)
    const hasChildren = node.children && node.children.length > 0

    const Icon = getIconForType(node.type)

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
            <div
                className={cn(
                    "flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors group",
                    level > 0 && "ml-6 border-l pl-4"
                )}
            >
                <div className="flex items-center gap-2 flex-grow">
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-transparent" disabled={!hasChildren}>
                            {hasChildren ? (
                                isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                            ) : (
                                <span className="w-4 h-4" /> // Spacer
                            )}
                        </Button>
                    </CollapsibleTrigger>

                    <div className={cn("p-1.5 rounded-md", getColorsForType(node.type))}>
                        <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{node.name}</span>
                        <span className="text-[10px] uppercase text-muted-foreground tracking-wider">{node.type}</span>
                    </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddNode?.(node);
                        }}
                        title="Add Child"
                    >
                        <Plus className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onEditNode?.(node)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => onDeleteNode?.(node)}>
                                <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <CollapsibleContent>
                {node.children && node.children.map((child) => (
                    <TreeNode
                        key={child.id}
                        node={child}
                        level={level + 1}
                        onAddNode={onAddNode}
                        onEditNode={onEditNode}
                        onDeleteNode={onDeleteNode}
                    />
                ))}
            </CollapsibleContent>
        </Collapsible>
    )
}

function getIconForType(type: string) {
    switch (type) {
        case 'faculty': return Briefcase;
        case 'degree': return GraduationCap;
        case 'year': return Calendar;
        case 'semester': return Calendar; // Or a clock icon
        case 'specialization': return Folder;
        case 'batch': return Users;
        case 'class': return BookOpen;
        default: return Folder;
    }
}

function getColorsForType(type: string) {
    switch (type) {
        case 'faculty': return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
        case 'degree': return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
        case 'class': return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
        default: return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
}
