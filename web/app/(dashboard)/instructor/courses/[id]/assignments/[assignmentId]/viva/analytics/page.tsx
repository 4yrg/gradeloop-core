"use client";

import { use } from "react";
import Link from "next/link";
import { useState } from "react";
import {
    ArrowLeft,
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    Target,
    Clock,
    AlertTriangle,
    Download,
    Filter,
    Eye,
    Zap,
    ScatterChart,
    PieChart,
    Activity,
    Award,
    XCircle,
    CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    ScatterChart as RechartsScatterChart,
    Scatter,
    LineChart,
    Line,
    Area,
    AreaChart
} from "recharts";

// Mock data for analytics
const mockAnalyticsData = {
    overallPerformance: {
        scoreDistribution: [
            { range: '0-20', count: 2 },
            { range: '21-40', count: 5 },
            { range: '41-60', count: 12 },
            { range: '61-80', count: 18 },
            { range: '81-100', count: 23 }
        ],
        competencyBreakdown: [
            { name: 'Novice', value: 8, percentage: 15 },
            { name: 'Intermediate', value: 27, percentage: 52 },
            { name: 'Advanced', value: 20, percentage: 38 },
            { name: 'Expert', value: 5, percentage: 10 }
        ],
        passFailRate: { passed: 87, failed: 13 },
        averageScore: 78.5,
        totalStudents: 52
    },
    conceptMastery: {
        students: [
            { id: '101', name: 'Alice Johnson', concepts: [95, 88, 92, 85, 90] },
            { id: '102', name: 'Bob Smith', concepts: [76, 72, 80, 68, 75] },
            { id: '103', name: 'Carol Davis', concepts: [88, 85, 90, 82, 87] },
            { id: '104', name: 'David Wilson', concepts: [92, 89, 95, 88, 91] },
            { id: '105', name: 'Eva Martinez', concepts: [65, 60, 70, 55, 62] }
        ],
        conceptNames: ['AVL Rotations', 'Time Complexity', 'Communication', 'Algorithm Design', 'Problem Solving']
    },
    questionDifficulty: [
        { question: 'Q1: AVL Rotations', difficulty: 2.1, avgScore: 88, misconceptions: 3 },
        { question: 'Q2: Time Complexity', difficulty: 2.8, avgScore: 72, misconceptions: 12 },
        { question: 'Q3: Algorithm Design', difficulty: 3.2, avgScore: 65, misconceptions: 18 },
        { question: 'Q4: Communication', difficulty: 1.8, avgScore: 85, misconceptions: 5 },
        { question: 'Q5: Problem Solving', difficulty: 2.9, avgScore: 68, misconceptions: 15 }
    ],
    commonMisconceptions: [
        { misconception: 'O(n log n) vs O(log n)', frequency: 28, affectedStudents: 18, relatedConcept: 'Time Complexity' },
        { misconception: 'Rotation direction confusion', frequency: 15, affectedStudents: 12, relatedConcept: 'AVL Rotations' },
        { misconception: 'Memory allocation misunderstanding', frequency: 22, affectedStudents: 16, relatedConcept: 'Algorithm Design' },
        { misconception: 'Big O notation misuse', frequency: 31, affectedStudents: 24, relatedConcept: 'Time Complexity' },
        { misconception: 'Tree balancing criteria', frequency: 19, affectedStudents: 14, relatedConcept: 'AVL Rotations' }
    ],
    timeAnalysis: {
        averageDuration: 14.2,
        durationVsScore: [
            { duration: 8, score: 65 },
            { duration: 10, score: 72 },
            { duration: 12, score: 78 },
            { duration: 15, score: 85 },
            { duration: 18, score: 88 },
            { duration: 20, score: 92 }
        ],
        questionTimeBreakdown: [
            { question: 'Q1', avgTime: 2.1 },
            { question: 'Q2', avgTime: 3.2 },
            { question: 'Q3', avgTime: 4.5 },
            { question: 'Q4', avgTime: 2.8 },
            { question: 'Q5', avgTime: 3.6 }
        ]
    },
    adaptiveAlgorithm: {
        difficultyAdjustments: 156,
        averageThetaTrajectory: [
            { question: 1, theta: 0.0 },
            { question: 2, theta: 0.3 },
            { question: 3, theta: 0.8 },
            { question: 4, theta: 1.2 },
            { question: 5, theta: 1.8 }
        ],
        fisherInfoSuccess: 89
    },
    outliers: [
        { studentId: '105', name: 'Eva Martinez', reason: 'Significantly lower than expected', deviation: -2.1 },
        { studentId: '120', name: 'Frank Brown', reason: 'Unusually high variance across concepts', deviation: 1.8 },
        { studentId: '108', name: 'Grace Lee', reason: 'Perfect score with minimal time', deviation: 2.3 }
    ],
    assessmentCorrelations: {
        vivaVsAutograder: [
            { vivaScore: 65, autograderScore: 78 },
            { vivaScore: 72, autograderScore: 82 },
            { vivaScore: 85, autograderScore: 88 },
            { vivaScore: 92, autograderScore: 95 },
            { vivaScore: 45, autograderScore: 52 }
        ],
        vivaVsManual: [
            { vivaScore: 78, manualScore: 82 },
            { vivaScore: 88, manualScore: 85 },
            { vivaScore: 65, manualScore: 70 },
            { vivaScore: 92, manualScore: 90 }
        ]
    }
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function ScoreDistributionChart({ data }: { data: typeof mockAnalyticsData.overallPerformance.scoreDistribution }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Score Distribution
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

function CompetencyPieChart({ data }: { data: typeof mockAnalyticsData.overallPerformance.competencyBreakdown }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Competency Breakdown
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percentage }) => `${name}: ${percentage}%`}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </RechartsPieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

function ConceptMasteryHeatmap({ data }: { data: typeof mockAnalyticsData.conceptMastery }) {
    const getHeatmapColor = (value: number) => {
        if (value >= 85) return 'bg-green-500';
        if (value >= 70) return 'bg-yellow-500';
        if (value >= 55) return 'bg-orange-500';
        return 'bg-red-500';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Concept Mastery Heatmap
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="p-2 text-left font-medium border">Student</th>
                                {data.conceptNames.map((concept, index) => (
                                    <th key={index} className="p-2 text-center font-medium border text-xs">
                                        {concept}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.students.map((student) => (
                                <tr key={student.id}>
                                    <td className="p-2 border font-medium text-sm">{student.name}</td>
                                    {student.concepts.map((score, index) => (
                                        <td key={index} className="p-1 border text-center">
                                            <div className={`w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold ${getHeatmapColor(score)}`}>
                                                {score}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        85-100%
                    </span>
                    <span className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                        70-84%
                    </span>
                    <span className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-orange-500 rounded"></div>
                        55-69%
                    </span>
                    <span className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        0-54%
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

function QuestionDifficultyTable({ data }: { data: typeof mockAnalyticsData.questionDifficulty }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    Question Difficulty Analysis
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.map((question, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                                <h4 className="font-medium">{question.question}</h4>
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <span>Difficulty: {question.difficulty}/5</span>
                                    <span>Avg Score: {question.avgScore}%</span>
                                    <span>Misconceptions: {question.misconceptions}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <Badge variant={question.avgScore < 70 ? "destructive" : question.avgScore < 80 ? "secondary" : "default"}>
                                    {question.avgScore < 70 ? "Hard" : question.avgScore < 80 ? "Medium" : "Easy"}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function MisconceptionsFrequencyChart({ data }: { data: typeof mockAnalyticsData.commonMisconceptions }) {
    const chartData = data.map(item => ({
        name: item.misconception.length > 30 ? item.misconception.substring(0, 30) + '...' : item.misconception,
        frequency: item.frequency,
        affected: item.affectedStudents
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Common Misconceptions
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="frequency" fill="#ef4444" name="Frequency" />
                        <Bar dataKey="affected" fill="#f97316" name="Affected Students" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

function TimeAnalysisCharts({ data }: { data: typeof mockAnalyticsData.timeAnalysis }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Duration vs Score Correlation
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <RechartsScatterChart data={data.durationVsScore}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="duration" name="Duration (min)" />
                            <YAxis dataKey="score" name="Score" />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                            <Scatter name="Students" dataKey="score" fill="#3b82f6" />
                        </RechartsScatterChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Time per Question
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={data.questionTimeBreakdown}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="question" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="avgTime" fill="#10b981" name="Avg Time (min)" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

function AdaptiveAlgorithmMetrics({ data }: { data: typeof mockAnalyticsData.adaptiveAlgorithm }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Adaptive Algorithm Effectiveness
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{data.difficultyAdjustments}</div>
                        <div className="text-sm text-muted-foreground">Difficulty Adjustments</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{data.fisherInfoSuccess}%</div>
                        <div className="text-sm text-muted-foreground">Fisher Info Success</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">1.8</div>
                        <div className="text-sm text-muted-foreground">Avg Final θ</div>
                    </div>
                </div>

                <div>
                    <h4 className="font-medium mb-2">Average Ability Trajectory</h4>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={data.averageThetaTrajectory}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="question" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="theta" stroke="#8b5cf6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

function OutliersList({ data }: { data: typeof mockAnalyticsData.outliers }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Outlier Detection
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.map((outlier, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="font-medium">{outlier.name}</p>
                                    <p className="text-sm text-muted-foreground">{outlier.reason}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <Badge variant="destructive">
                                    {outlier.deviation > 0 ? '+' : ''}{outlier.deviation}σ
                                </Badge>
                                <Button variant="outline" size="sm" className="ml-2">
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

function AssessmentCorrelationScatter({ data }: { data: typeof mockAnalyticsData.assessmentCorrelations }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ScatterChart className="h-5 w-5" />
                        Viva vs Autograder Scores
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <RechartsScatterChart data={data.vivaVsAutograder}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="vivaScore" name="Viva Score" />
                            <YAxis dataKey="autograderScore" name="Autograder Score" />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                            <Scatter name="Students" dataKey="autograderScore" fill="#3b82f6" />
                        </RechartsScatterChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Viva vs Manual Grading
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <RechartsScatterChart data={data.vivaVsManual}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="vivaScore" name="Viva Score" />
                            <YAxis dataKey="manualScore" name="Manual Score" />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                            <Scatter name="Students" dataKey="manualScore" fill="#10b981" />
                        </RechartsScatterChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

export default function AnalyticsPage({
    params
}: {
    params: Promise<{ id: string; assignmentId: string }>
}) {
    const { id: courseId, assignmentId } = use(params);
    const [timeRange, setTimeRange] = useState('all');

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-7xl mx-auto w-full px-4 pt-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Button variant="ghost" asChild className="w-fit -ml-2 text-muted-foreground hover:text-foreground">
                    <Link href={`/instructor/courses/${courseId}/assignments/${assignmentId}/viva-voce`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Viva Dashboard
                    </Link>
                </Button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Viva Analytics</h1>
                        <p className="text-muted-foreground mt-1">
                            Comprehensive analysis of viva assessment performance across all students.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Export Report
                        </Button>
                    </div>
                </div>
            </div>

            {/* Key Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                                <p className="text-2xl font-bold">{mockAnalyticsData.overallPerformance.totalStudents}</p>
                            </div>
                            <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                                <p className="text-2xl font-bold">{mockAnalyticsData.overallPerformance.averageScore}%</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Pass Rate</p>
                                <p className="text-2xl font-bold">{mockAnalyticsData.overallPerformance.passFailRate.passed}%</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                                <p className="text-2xl font-bold">{mockAnalyticsData.timeAnalysis.averageDuration}min</p>
                            </div>
                            <Clock className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="concepts">Concepts</TabsTrigger>
                    <TabsTrigger value="questions">Questions</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ScoreDistributionChart data={mockAnalyticsData.overallPerformance.scoreDistribution} />
                        <CompetencyPieChart data={mockAnalyticsData.overallPerformance.competencyBreakdown} />
                    </div>
                    <TimeAnalysisCharts data={mockAnalyticsData.timeAnalysis} />
                    <AssessmentCorrelationScatter data={mockAnalyticsData.assessmentCorrelations} />
                </TabsContent>

                <TabsContent value="concepts" className="space-y-6">
                    <ConceptMasteryHeatmap data={mockAnalyticsData.conceptMastery} />
                    <MisconceptionsFrequencyChart data={mockAnalyticsData.commonMisconceptions} />
                </TabsContent>

                <TabsContent value="questions" className="space-y-6">
                    <QuestionDifficultyTable data={mockAnalyticsData.questionDifficulty} />
                </TabsContent>

                <TabsContent value="insights" className="space-y-6">
                    <AdaptiveAlgorithmMetrics data={mockAnalyticsData.adaptiveAlgorithm} />
                    <OutliersList data={mockAnalyticsData.outliers} />
                </TabsContent>
            </Tabs>
        </div>
    );
}