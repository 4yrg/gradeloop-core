"use client";

import { use } from "react";
import Link from "next/link";
import { useState } from "react";
import {
    ArrowLeft,
    Plus,
    Edit,
    Trash2,
    Save,
    Eye,
    Download,
    Upload,
    Copy,
    ChevronDown,
    ChevronRight,
    Target,
    BookOpen,
    AlertTriangle,
    BarChart3,
    FileText,
    Settings,
    CheckCircle,
    XCircle,
    HelpCircle,
    Lightbulb,
    Users
} from "lucide-react";
import { Button } from "../../../../../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../../components/ui/card";
import { Badge } from "../../../../../../../../../components/ui/badge";
import { Input } from "../../../../../../../../../components/ui/input";
import { Label } from "../../../../../../../../../components/ui/label";
import { Textarea } from "../../../../../../../../../components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "../../../../../../../../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../../../../../../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../../../../../../../components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../../../../../../../components/ui/collapsible";
import { Progress } from "../../../../../../../../../components/ui/progress";
import { Separator } from "../../../../../../../../../components/ui/separator";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

// Mock data for the rubric
const mockRubricData = {
    concepts: [
        {
            id: '1',
            name: 'AVL Tree Rotations',
            description: 'Understanding of single and double rotations to maintain balance',
            weight: 25,
            subConcepts: ['Single Right Rotation', 'Single Left Rotation', 'Double Rotations'],
            relatedCode: 'lines 45-67 in bst.py',
            questions: [
                { text: 'Explain how a single right rotation works', difficulty: 'intermediate' },
                { text: 'When would you use a double rotation?', difficulty: 'advanced' }
            ],
            misconceptions: [
                {
                    misconception: 'Confusing rotation directions',
                    keywords: ['wrong direction', 'opposite rotation'],
                    correction: 'Remember: rotate towards the heavier subtree'
                }
            ],
            gradingCriteria: {
                novice: 'Cannot explain basic rotation mechanics',
                intermediate: 'Understands single rotations but struggles with doubles',
                advanced: 'Mastery of all rotation types with correct application',
                expert: 'Can derive rotation algorithms from first principles'
            }
        },
        {
            id: '2',
            name: 'Time Complexity Analysis',
            description: 'Big O notation and complexity analysis for tree operations',
            weight: 20,
            subConcepts: ['O(log n) operations', 'Worst-case scenarios'],
            relatedCode: 'lines 12-25 in bst.py',
            questions: [
                { text: 'What is the time complexity of search in an AVL tree?', difficulty: 'beginner' },
                { text: 'Explain why rotations maintain O(log n) height', difficulty: 'advanced' }
            ],
            misconceptions: [
                {
                    misconception: 'Thinking AVL trees have O(1) operations',
                    keywords: ['constant time', 'O(1)', 'always fast'],
                    correction: 'AVL trees guarantee O(log n) for all operations due to height balancing'
                }
            ],
            gradingCriteria: {
                novice: 'Cannot distinguish between O(1) and O(log n)',
                intermediate: 'Knows basic Big O but misses edge cases',
                advanced: 'Correctly analyzes all tree operations',
                expert: 'Can prove complexity bounds mathematically'
            }
        },
        {
            id: '3',
            name: 'Communication Clarity',
            description: 'Ability to explain concepts clearly and accurately',
            weight: 15,
            subConcepts: ['Technical terminology', 'Step-by-step explanations'],
            relatedCode: 'N/A - verbal assessment',
            questions: [
                { text: 'Explain your rotation implementation in plain English', difficulty: 'intermediate' }
            ],
            misconceptions: [],
            gradingCriteria: {
                novice: 'Uses incorrect terminology, unclear explanations',
                intermediate: 'Generally clear but misses some technical details',
                advanced: 'Clear, accurate explanations with proper terminology',
                expert: 'Exceptional clarity with analogies and examples'
            }
        }
    ],
    totalWeight: 60 // Concepts add up to 60%, leaving 40% for other factors
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function ConceptList({ concepts, onEdit, onDelete }: {
    concepts: typeof mockRubricData.concepts,
    onEdit: (concept: any) => void,
    onDelete: (id: string) => void
}) {
    return (
        <div className="space-y-4">
            {concepts.map((concept, index) => (
                <Card key={concept.id} className="relative">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-blue-600" />
                                    <CardTitle className="text-lg">{concept.name}</CardTitle>
                                </div>
                                <Badge variant="outline">{concept.weight}%</Badge>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => onEdit(concept)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => onDelete(concept.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{concept.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {concept.subConcepts.length > 0 && (
                            <div>
                                <Label className="text-xs font-medium text-muted-foreground">SUB-CONCEPTS</Label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {concept.subConcepts.map((sub, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs">{sub}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <Label className="text-xs font-medium text-muted-foreground">QUESTIONS</Label>
                                <p className="mt-1">{concept.questions.length} questions defined</p>
                            </div>
                            <div>
                                <Label className="text-xs font-medium text-muted-foreground">MISCONCEPTIONS</Label>
                                <p className="mt-1">{concept.misconceptions.length} identified</p>
                            </div>
                        </div>
                        {concept.relatedCode !== 'N/A' && (
                            <div className="text-xs text-muted-foreground">
                                <FileText className="h-3 w-3 inline mr-1" />
                                Related code: {concept.relatedCode}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function ConceptEditModal({ concept, isOpen, onClose, onSave }: {
    concept: any,
    isOpen: boolean,
    onClose: () => void,
    onSave: (data: any) => void
}) {
    const [formData, setFormData] = useState(concept || {
        name: '',
        description: '',
        weight: 10,
        subConcepts: [],
        relatedCode: '',
        questions: [],
        misconceptions: [],
        gradingCriteria: {
            novice: '',
            intermediate: '',
            advanced: '',
            expert: ''
        }
    });

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{concept ? 'Edit Concept' : 'Add New Concept'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Concept Name</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., AVL Tree Rotations"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Weight (%)</Label>
                            <Input
                                type="number"
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                                min="1"
                                max="100"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="What should students understand about this concept?"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Related Code Sections</Label>
                        <Input
                            value={formData.relatedCode}
                            onChange={(e) => setFormData({ ...formData, relatedCode: e.target.value })}
                            placeholder="e.g., lines 45-67 in bst.py"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Sub-concepts (comma-separated)</Label>
                        <Input
                            value={formData.subConcepts.join(', ')}
                            onChange={(e) => setFormData({
                                ...formData,
                                subConcepts: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                            })}
                            placeholder="Single Right Rotation, Single Left Rotation, Double Rotations"
                        />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <Label className="text-base">Grading Criteria</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm">Novice</Label>
                                <Textarea
                                    value={formData.gradingCriteria.novice}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        gradingCriteria: { ...formData.gradingCriteria, novice: e.target.value }
                                    })}
                                    rows={2}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm">Intermediate</Label>
                                <Textarea
                                    value={formData.gradingCriteria.intermediate}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        gradingCriteria: { ...formData.gradingCriteria, intermediate: e.target.value }
                                    })}
                                    rows={2}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm">Advanced</Label>
                                <Textarea
                                    value={formData.gradingCriteria.advanced}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        gradingCriteria: { ...formData.gradingCriteria, advanced: e.target.value }
                                    })}
                                    rows={2}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm">Expert</Label>
                                <Textarea
                                    value={formData.gradingCriteria.expert}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        gradingCriteria: { ...formData.gradingCriteria, expert: e.target.value }
                                    })}
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSave}>Save Concept</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function RubricVisualization({ concepts }: { concepts: typeof mockRubricData.concepts }) {
    const pieData = concepts.map((concept, index) => ({
        name: concept.name,
        value: concept.weight,
        color: COLORS[index % COLORS.length]
    }));

    const barData = concepts.map(concept => ({
        name: concept.name.length > 15 ? concept.name.substring(0, 15) + '...' : concept.name,
        questions: concept.questions.length,
        misconceptions: concept.misconceptions.length
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Weight Distribution
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}%`}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Content Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="questions" fill="#3b82f6" name="Questions" />
                            <Bar dataKey="misconceptions" fill="#ef4444" name="Misconceptions" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

export default function RubricEditorPage({
    params
}: {
    params: Promise<{ id: string; assignmentId: string }>
}) {
    const { id: courseId, assignmentId } = use(params);
    const [concepts, setConcepts] = useState(mockRubricData.concepts);
    const [editingConcept, setEditingConcept] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const handleAddConcept = () => {
        setEditingConcept(null);
        setIsEditModalOpen(true);
    };

    const handleEditConcept = (concept: any) => {
        setEditingConcept(concept);
        setIsEditModalOpen(true);
    };

    const handleDeleteConcept = (id: string) => {
        setConcepts(concepts.filter(c => c.id !== id));
    };

    const handleSaveConcept = (conceptData: any) => {
        if (editingConcept) {
            setConcepts(concepts.map(c => c.id === editingConcept.id ? { ...conceptData, id: c.id } : c));
        } else {
            const newConcept = { ...conceptData, id: Date.now().toString() };
            setConcepts([...concepts, newConcept]);
        }
    };

    const totalWeight = concepts.reduce((sum, c) => sum + c.weight, 0);

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-7xl mx-auto w-full px-4 pt-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Button variant="ghost" asChild className="w-fit -ml-2 text-muted-foreground hover:text-foreground">
                    <Link href={`/instructor/courses/${courseId}/assignments/${assignmentId}/viva`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Viva Dashboard
                    </Link>
                </Button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Rubric Editor</h1>
                        <p className="text-muted-foreground mt-1">
                            Define concepts, questions, and grading criteria for viva assessments.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Button variant="outline">
                            <Upload className="mr-2 h-4 w-4" />
                            Import
                        </Button>
                        <Button>
                            <Save className="mr-2 h-4 w-4" />
                            Save Rubric
                        </Button>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Viva Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button variant="outline" asChild className="justify-start h-auto p-4">
                            <Link href={`/instructor/courses/${courseId}/assignments/${assignmentId}/viva/configure`} className="flex items-center gap-3">
                                <Settings className="h-5 w-5" />
                                <div className="text-left">
                                    <p className="font-medium">Configure Viva</p>
                                    <p className="text-xs text-muted-foreground">Set up assessment parameters</p>
                                </div>
                            </Link>
                        </Button>
                        <Button variant="outline" asChild className="justify-start h-auto p-4">
                            <Link href={`/instructor/courses/${courseId}/assignments/${assignmentId}/viva/sessions`} className="flex items-center gap-3">
                                <Users className="h-5 w-5" />
                                <div className="text-left">
                                    <p className="font-medium">View Sessions</p>
                                    <p className="text-xs text-muted-foreground">Review student performances</p>
                                </div>
                            </Link>
                        </Button>
                        <Button variant="outline" asChild className="justify-start h-auto p-4">
                            <Link href={`/instructor/courses/${courseId}/assignments/${assignmentId}/viva/analytics`} className="flex items-center gap-3">
                                <BarChart3 className="h-5 w-5" />
                                <div className="text-left">
                                    <p className="font-medium">Analytics</p>
                                    <p className="text-xs text-muted-foreground">Performance insights</p>
                                </div>
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Weight Summary */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Total Weight Distribution</h3>
                            <p className="text-sm text-muted-foreground">
                                Concepts account for {totalWeight}% of total assessment
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold">{totalWeight}%</div>
                            <div className="text-sm text-muted-foreground">of 100%</div>
                        </div>
                    </div>
                    <Progress value={totalWeight} className="mt-4" />
                    {totalWeight > 100 && (
                        <p className="text-sm text-red-600 mt-2">⚠️ Total weight exceeds 100%</p>
                    )}
                    {totalWeight < 100 && (
                        <p className="text-sm text-blue-600 mt-2">
                            💡 {100 - totalWeight}% available for communication, problem-solving, etc.
                        </p>
                    )}
                </CardContent>
            </Card>

            <Tabs defaultValue="concepts" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="concepts">Concepts</TabsTrigger>
                    <TabsTrigger value="questions">Questions</TabsTrigger>
                    <TabsTrigger value="misconceptions">Misconceptions</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="concepts" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Concept Definitions</h2>
                        <Button onClick={handleAddConcept}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Concept
                        </Button>
                    </div>
                    <ConceptList
                        concepts={concepts}
                        onEdit={handleEditConcept}
                        onDelete={handleDeleteConcept}
                    />
                </TabsContent>

                <TabsContent value="questions" className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Question Prompts</h2>
                        <div className="space-y-4">
                            {concepts.map((concept) => (
                                <Card key={concept.id}>
                                    <CardHeader>
                                        <CardTitle className="text-lg">{concept.name}</CardTitle>
                                        <p className="text-sm text-muted-foreground">{concept.questions.length} questions</p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {concept.questions.map((question, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div className="flex-1">
                                                        <p className="font-medium">{question.text}</p>
                                                        <Badge variant="outline" className="mt-1">
                                                            {question.difficulty}
                                                        </Badge>
                                                    </div>
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button variant="outline" className="w-full">
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Question
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="misconceptions" className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Common Misconceptions</h2>
                        <div className="space-y-4">
                            {concepts.map((concept) => (
                                <Card key={concept.id}>
                                    <CardHeader>
                                        <CardTitle className="text-lg">{concept.name}</CardTitle>
                                        <p className="text-sm text-muted-foreground">{concept.misconceptions.length} misconceptions identified</p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {concept.misconceptions.map((misconception, index) => (
                                                <div key={index} className="p-4 border rounded-lg space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <AlertTriangle className="h-4 w-4 text-red-600" />
                                                        <h4 className="font-medium">{misconception.misconception}</h4>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        <strong>Keywords:</strong> {misconception.keywords.join(', ')}
                                                    </div>
                                                    <div className="text-sm">
                                                        <strong>Correction:</strong> {misconception.correction}
                                                    </div>
                                                </div>
                                            ))}
                                            <Button variant="outline" className="w-full">
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Misconception
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="preview" className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Rubric Preview</h2>
                        <RubricVisualization concepts={concepts} />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="h-5 w-5" />
                                Sample Assessment Structure
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="text-sm">
                                    <strong>Estimated Viva Duration:</strong> 12-15 minutes
                                </div>
                                <div className="text-sm">
                                    <strong>Question Count:</strong> {concepts.reduce((sum, c) => sum + c.questions.length, 0)} total questions across {concepts.length} concepts
                                </div>
                                <div className="text-sm">
                                    <strong>Misconception Detection:</strong> {concepts.reduce((sum, c) => sum + c.misconceptions.length, 0)} patterns configured
                                </div>
                                <Separator />
                                <div className="text-sm text-muted-foreground">
                                    <Lightbulb className="h-4 w-4 inline mr-1" />
                                    This rubric will generate adaptive viva sessions based on student performance and detected misconceptions.
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <ConceptEditModal
                concept={editingConcept}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveConcept}
            />
        </div>
    );
}