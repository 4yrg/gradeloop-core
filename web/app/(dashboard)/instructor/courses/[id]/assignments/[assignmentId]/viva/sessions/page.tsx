"use client";

import { use } from "react";
import Link from "next/link";
import { useState, useMemo } from "react";
import {
    ArrowLeft,
    Search,
    Filter,
    Download,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    MoreHorizontal,
    ChevronDown,
    Calendar,
    User,
    Target,
    FileText,
    Mail,
    CheckSquare,
    Square,
    SortAsc,
    SortDesc,
    Settings,
    BookOpen,
    BarChart3
} from "lucide-react";
import { Button } from "../../../../../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../../components/ui/card";
import { Input } from "../../../../../../../../../components/ui/input";
import { Badge } from "../../../../../../../../../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../../../../../../components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "../../../../../../../../../components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../../../../../../../../../components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../../../../../../../../components/ui/dropdown-menu";
import { Checkbox } from "../../../../../../../../../components/ui/checkbox";
import { Separator } from "../../../../../../../../../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../../../../../../components/ui/tabs";

// Mock data for sessions
const mockSessions = [
    {
        id: '1',
        student: {
            id: '101',
            name: 'Alice Johnson',
            email: 'alice.johnson@university.edu',
            avatar: null
        },
        status: 'completed',
        score: 92,
        competencyLevel: 'Advanced',
        duration: 14,
        startedAt: '2026-01-04T10:30:00Z',
        flagged: false,
        flaggedReason: null
    },
    {
        id: '2',
        student: {
            id: '102',
            name: 'Bob Smith',
            email: 'bob.smith@university.edu',
            avatar: null
        },
        status: 'completed',
        score: 76,
        competencyLevel: 'Intermediate',
        duration: 11,
        startedAt: '2026-01-04T09:15:00Z',
        flagged: true,
        flaggedReason: 'Low score with contradictory answers'
    },
    {
        id: '3',
        student: {
            id: '103',
            name: 'Carol Davis',
            email: 'carol.davis@university.edu',
            avatar: null
        },
        status: 'in_progress',
        score: null,
        competencyLevel: null,
        duration: 8,
        startedAt: '2026-01-04T14:20:00Z',
        flagged: false,
        flaggedReason: null
    },
    {
        id: '4',
        student: {
            id: '104',
            name: 'David Wilson',
            email: 'david.wilson@university.edu',
            avatar: null
        },
        status: 'completed',
        score: 85,
        competencyLevel: 'Intermediate',
        duration: 13,
        startedAt: '2026-01-03T16:45:00Z',
        flagged: false,
        flaggedReason: null
    },
    {
        id: '5',
        student: {
            id: '105',
            name: 'Eva Martinez',
            email: 'eva.martinez@university.edu',
            avatar: null
        },
        status: 'failed',
        score: 45,
        competencyLevel: 'Novice',
        duration: 7,
        startedAt: '2026-01-03T11:30:00Z',
        flagged: true,
        flaggedReason: 'Multiple misconceptions detected'
    },
    {
        id: '6',
        student: {
            id: '106',
            name: 'Frank Brown',
            email: 'frank.brown@university.edu',
            avatar: null
        },
        status: 'completed',
        score: 88,
        competencyLevel: 'Advanced',
        duration: 16,
        startedAt: '2026-01-02T13:20:00Z',
        flagged: false,
        flaggedReason: null
    }
];

type SortField = 'name' | 'status' | 'score' | 'competencyLevel' | 'duration' | 'startedAt';
type SortDirection = 'asc' | 'desc';

function getStatusBadge(status: string) {
    switch (status) {
        case 'completed':
            return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
        case 'in_progress':
            return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
        case 'failed':
            return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
}

function getCompetencyBadge(level: string | null) {
    if (!level) return <Badge variant="outline">-</Badge>;

    const colors = {
        'Novice': 'bg-gray-100 text-gray-800',
        'Intermediate': 'bg-yellow-100 text-yellow-800',
        'Advanced': 'bg-blue-100 text-blue-800',
        'Expert': 'bg-purple-100 text-purple-800'
    };

    return <Badge className={colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{level}</Badge>;
}

function getScoreColor(score: number | null) {
    if (!score) return 'text-muted-foreground';
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
}

function SessionFilters({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    scoreRange,
    setScoreRange,
    competencyFilter,
    setCompetencyFilter,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection
}: {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    statusFilter: string;
    setStatusFilter: (value: string) => void;
    scoreRange: { min: string; max: string };
    setScoreRange: (value: { min: string; max: string }) => void;
    competencyFilter: string;
    setCompetencyFilter: (value: string) => void;
    sortField: SortField;
    setSortField: (value: SortField) => void;
    sortDirection: SortDirection;
    setSortDirection: (value: SortDirection) => void;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters & Search
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by student name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Competency Level</label>
                        <Select value={competencyFilter} onValueChange={setCompetencyFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All levels" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Levels</SelectItem>
                                <SelectItem value="Novice">Novice</SelectItem>
                                <SelectItem value="Intermediate">Intermediate</SelectItem>
                                <SelectItem value="Advanced">Advanced</SelectItem>
                                <SelectItem value="Expert">Expert</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Score Range</label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                placeholder="Min"
                                value={scoreRange.min}
                                onChange={(e) => setScoreRange({ ...scoreRange, min: e.target.value })}
                                className="w-20"
                            />
                            <Input
                                type="number"
                                placeholder="Max"
                                value={scoreRange.max}
                                onChange={(e) => setScoreRange({ ...scoreRange, max: e.target.value })}
                                className="w-20"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Sort By</label>
                        <div className="flex gap-2">
                            <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="name">Name</SelectItem>
                                    <SelectItem value="status">Status</SelectItem>
                                    <SelectItem value="score">Score</SelectItem>
                                    <SelectItem value="competencyLevel">Level</SelectItem>
                                    <SelectItem value="duration">Duration</SelectItem>
                                    <SelectItem value="startedAt">Date</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                            >
                                {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function BulkActionsToolbar({
    selectedSessions,
    onClearSelection,
    onBulkApprove,
    onBulkReject,
    onExport,
    onSendFeedback
}: {
    selectedSessions: string[];
    onClearSelection: () => void;
    onBulkApprove: () => void;
    onBulkReject: () => void;
    onExport: () => void;
    onSendFeedback: () => void;
}) {
    if (selectedSessions.length === 0) return null;

    return (
        <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">
                            {selectedSessions.length} session{selectedSessions.length !== 1 ? 's' : ''} selected
                        </span>
                        <Button variant="ghost" size="sm" onClick={onClearSelection}>
                            Clear selection
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onBulkApprove}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                        </Button>
                        <Button variant="outline" size="sm" onClick={onBulkReject}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <Button variant="outline" size="sm" onClick={onExport}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                        <Button variant="outline" size="sm" onClick={onSendFeedback}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Feedback
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function FlaggedSessionsPanel({ sessions }: { sessions: typeof mockSessions }) {
    const flaggedSessions = sessions.filter(s => s.flagged);

    if (flaggedSessions.length === 0) return null;

    return (
        <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="h-5 w-5" />
                    Flagged Sessions ({flaggedSessions.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {flaggedSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback>
                                        {session.student.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{session.student.name}</p>
                                    <p className="text-sm text-muted-foreground">{session.flaggedReason}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="destructive">Needs Review</Badge>
                                <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-2" />
                                    Review
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default function SessionsListPage({
    params
}: {
    params: Promise<{ id: string; assignmentId: string }>
}) {
    const { id: courseId, assignmentId } = use(params);

    // Filter and sort state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [scoreRange, setScoreRange] = useState({ min: '', max: '' });
    const [competencyFilter, setCompetencyFilter] = useState('all');
    const [sortField, setSortField] = useState<SortField>('startedAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Selection state
    const [selectedSessions, setSelectedSessions] = useState<string[]>([]);

    // Filtered and sorted sessions
    const filteredAndSortedSessions = useMemo(() => {
        let filtered = mockSessions.filter(session => {
            // Search filter
            if (searchTerm && !session.student.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !session.student.id.includes(searchTerm)) {
                return false;
            }

            // Status filter
            if (statusFilter !== 'all' && session.status !== statusFilter) {
                return false;
            }

            // Competency filter
            if (competencyFilter !== 'all' && session.competencyLevel !== competencyFilter) {
                return false;
            }

            // Score range filter
            if (scoreRange.min && session.score && session.score < parseInt(scoreRange.min)) {
                return false;
            }
            if (scoreRange.max && session.score && session.score > parseInt(scoreRange.max)) {
                return false;
            }

            return true;
        });

        // Sort
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortField) {
                case 'name':
                    aValue = a.student.name.toLowerCase();
                    bValue = b.student.name.toLowerCase();
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                case 'score':
                    aValue = a.score || 0;
                    bValue = b.score || 0;
                    break;
                case 'competencyLevel':
                    aValue = a.competencyLevel || '';
                    bValue = b.competencyLevel || '';
                    break;
                case 'duration':
                    aValue = a.duration;
                    bValue = b.duration;
                    break;
                case 'startedAt':
                    aValue = new Date(a.startedAt).getTime();
                    bValue = new Date(b.startedAt).getTime();
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [mockSessions, searchTerm, statusFilter, scoreRange, competencyFilter, sortField, sortDirection]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedSessions(filteredAndSortedSessions.map(s => s.id));
        } else {
            setSelectedSessions([]);
        }
    };

    const handleSelectSession = (sessionId: string, checked: boolean) => {
        if (checked) {
            setSelectedSessions([...selectedSessions, sessionId]);
        } else {
            setSelectedSessions(selectedSessions.filter(id => id !== sessionId));
        }
    };

    const handleBulkApprove = () => {
        // Implement bulk approve logic
        console.log('Approving sessions:', selectedSessions);
        setSelectedSessions([]);
    };

    const handleBulkReject = () => {
        // Implement bulk reject logic
        console.log('Rejecting sessions:', selectedSessions);
        setSelectedSessions([]);
    };

    const handleExport = () => {
        // Implement export logic
        console.log('Exporting sessions:', selectedSessions);
    };

    const handleSendFeedback = () => {
        // Implement send feedback logic
        console.log('Sending feedback to sessions:', selectedSessions);
    };

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
                        <h1 className="text-3xl font-bold tracking-tight">Viva Sessions</h1>
                        <p className="text-muted-foreground mt-1">
                            Monitor and manage all student viva assessment sessions.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Export All
                        </Button>
                        <Button>
                            <FileText className="mr-2 h-4 w-4" />
                            Generate Report
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
                            <Link href={`/instructor/courses/${courseId}/assignments/${assignmentId}/viva/rubric`} className="flex items-center gap-3">
                                <BookOpen className="h-5 w-5" />
                                <div className="text-left">
                                    <p className="font-medium">Edit Rubric</p>
                                    <p className="text-xs text-muted-foreground">Modify evaluation criteria</p>
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

            {/* Flagged Sessions */}
            <FlaggedSessionsPanel sessions={mockSessions} />

            {/* Filters */}
            <SessionFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                scoreRange={scoreRange}
                setScoreRange={setScoreRange}
                competencyFilter={competencyFilter}
                setCompetencyFilter={setCompetencyFilter}
                sortField={sortField}
                setSortField={setSortField}
                sortDirection={sortDirection}
                setSortDirection={setSortDirection}
            />

            {/* Bulk Actions */}
            <BulkActionsToolbar
                selectedSessions={selectedSessions}
                onClearSelection={() => setSelectedSessions([])}
                onBulkApprove={handleBulkApprove}
                onBulkReject={handleBulkReject}
                onExport={handleExport}
                onSendFeedback={handleSendFeedback}
            />

            {/* Sessions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Sessions ({filteredAndSortedSessions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={selectedSessions.length === filteredAndSortedSessions.length && filteredAndSortedSessions.length > 0}
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Competency</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Flagged</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedSessions.map((session) => (
                                <TableRow key={session.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedSessions.includes(session.id)}
                                            onCheckedChange={(checked) => handleSelectSession(session.id, checked as boolean)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="text-xs">
                                                    {session.student.name.split(' ').map(n => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm">{session.student.name}</p>
                                                <p className="text-xs text-muted-foreground">{session.student.id}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(session.status)}</TableCell>
                                    <TableCell>
                                        <span className={`font-medium ${getScoreColor(session.score)}`}>
                                            {session.score ? `${session.score}/100` : '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell>{getCompetencyBadge(session.competencyLevel)}</TableCell>
                                    <TableCell>{session.duration}min</TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {new Date(session.startedAt).toLocaleDateString()}
                                            <br />
                                            <span className="text-muted-foreground">
                                                {new Date(session.startedAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {session.flagged && (
                                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    Review Session
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download Report
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem>
                                                    <Mail className="h-4 w-4 mr-2" />
                                                    Send Feedback
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}