'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { ShieldAlert, TrendingUp, TrendingDown } from 'lucide-react';
import type { KeystrokeDataPoint } from '../../lib/mock-submissions-data';

interface KeystrokeTimelineProps {
    data: KeystrokeDataPoint[];
    currentTime?: number;
    duration: number;
}

export function KeystrokeTimeline({ data, currentTime = 0, duration }: KeystrokeTimelineProps) {
    const chartData = useMemo(() => {
        return data.map((point) => ({
            time: Math.round(point.timestamp),
            score: Math.round(point.confidenceScore),
            speed: point.typingSpeed,
            pause: point.pauseDuration
        }));
    }, [data]);

    const averageScore = useMemo(() => {
        const sum = data.reduce((acc, point) => acc + point.confidenceScore, 0);
        return Math.round(sum / data.length);
    }, [data]);

    const getScoreColor = (score: number) => {
        if (score >= 70) return '#10b981'; // emerald-500
        if (score >= 50) return '#f59e0b'; // yellow-500
        return '#ef4444'; // red-500
    };

    const getScoreGradient = (score: number) => {
        if (score >= 70) return 'url(#colorGreen)';
        if (score >= 50) return 'url(#colorYellow)';
        return 'url(#colorRed)';
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-background border rounded-lg shadow-lg p-3">
                    <p className="text-xs font-bold mb-2">Time: {formatTime(data.time)}</p>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div 
                                className="h-2 w-2 rounded-full" 
                                style={{ backgroundColor: getScoreColor(data.score) }}
                            />
                            <p className="text-xs">Confidence: <span className="font-bold">{data.score}%</span></p>
                        </div>
                        <p className="text-xs text-muted-foreground">Speed: {Math.round(data.speed)} chars/min</p>
                        <p className="text-xs text-muted-foreground">Pause: {data.pause.toFixed(1)}s</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    const scoreLabel = averageScore >= 70 ? 'Healthy' : averageScore >= 50 ? 'Moderate' : 'Low Confidence';
    const scoreColor = getScoreColor(averageScore);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Keystroke Authentication Timeline</CardTitle>
                        <CardDescription>Real-time confidence score during code submission</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-xs text-muted-foreground">Average Score</div>
                            <div className="flex items-center gap-2">
                                <span 
                                    className="text-2xl font-bold"
                                    style={{ color: scoreColor }}
                                >
                                    {averageScore}%
                                </span>
                                <Badge 
                                    variant="outline"
                                    className="text-xs"
                                    style={{ 
                                        borderColor: scoreColor + '40',
                                        backgroundColor: scoreColor + '10',
                                        color: scoreColor
                                    }}
                                >
                                    {scoreLabel}
                                </Badge>
                            </div>
                        </div>
                        {averageScore < 50 && (
                            <ShieldAlert className="h-6 w-6 text-red-500" />
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Score threshold legend */}
                    <div className="flex items-center justify-center gap-6 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-emerald-500" />
                            <span className="text-muted-foreground">High Confidence (&gt; 70%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-yellow-500" />
                            <span className="text-muted-foreground">Medium (50-70%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-red-500" />
                            <span className="text-muted-foreground">Low Confidence (&lt; 50%)</span>
                        </div>
                    </div>

                    {/* Main Chart */}
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                                    </linearGradient>
                                    <linearGradient id="colorYellow" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                                    </linearGradient>
                                    <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                                <XAxis 
                                    dataKey="time" 
                                    tickFormatter={formatTime}
                                    stroke="#94a3b8"
                                    style={{ fontSize: '12px' }}
                                    label={{ value: 'Time (mm:ss)', position: 'insideBottom', offset: -5, style: { fontSize: '12px', fill: '#94a3b8' } }}
                                />
                                <YAxis 
                                    domain={[0, 100]}
                                    stroke="#94a3b8"
                                    style={{ fontSize: '12px' }}
                                    label={{ value: 'Confidence Score (%)', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#94a3b8' } }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                
                                {/* Reference lines for thresholds */}
                                <ReferenceLine y={70} stroke="#10b981" strokeDasharray="3 3" opacity={0.5} />
                                <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="3 3" opacity={0.5} />
                                
                                {/* Current playback position */}
                                {currentTime > 0 && (
                                    <ReferenceLine 
                                        x={Math.round(currentTime)} 
                                        stroke="#3b82f6" 
                                        strokeWidth={2}
                                        label={{ value: 'Current', position: 'top', fill: '#3b82f6', fontSize: 10 }}
                                    />
                                )}
                                
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke={getScoreColor(averageScore)}
                                    strokeWidth={2}
                                    fill={getScoreGradient(averageScore)}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                        <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Min Score</div>
                            <div className="text-lg font-bold" style={{ color: getScoreColor(Math.min(...data.map(d => d.confidenceScore))) }}>
                                {Math.round(Math.min(...data.map(d => d.confidenceScore)))}%
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Max Score</div>
                            <div className="text-lg font-bold" style={{ color: getScoreColor(Math.max(...data.map(d => d.confidenceScore))) }}>
                                {Math.round(Math.max(...data.map(d => d.confidenceScore)))}%
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Duration</div>
                            <div className="text-lg font-bold">{formatTime(Math.round(duration))}</div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
