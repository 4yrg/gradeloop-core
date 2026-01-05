import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Circle, CheckCircle2, Clock } from "lucide-react";

interface VivaStatusCardProps {
    status: 'not_started' | 'in_progress' | 'completed' | 'passed' | 'failed';
    scheduledDate?: string;
    duration?: string;
}

export function VivaStatusCard({ status, scheduledDate, duration }: VivaStatusCardProps) {
    const getStatusConfig = () => {
        switch (status) {
            case 'passed':
                return {
                    label: 'Passed',
                    color: 'text-green-500',
                    bg: 'bg-green-500/10',
                    border: 'border-green-500/20',
                    icon: CheckCircle2
                };
            case 'failed':
                return {
                    label: 'Failed',
                    color: 'text-red-500',
                    bg: 'bg-red-500/10',
                    border: 'border-red-500/20',
                    icon: Circle
                };
            case 'completed':
                return {
                    label: 'Completed',
                    color: 'text-blue-500',
                    bg: 'bg-blue-500/10',
                    border: 'border-blue-500/20',
                    icon: CheckCircle2
                };
            case 'in_progress':
                return {
                    label: 'In Progress',
                    color: 'text-blue-500',
                    bg: 'bg-blue-500/10',
                    border: 'border-blue-500/20',
                    icon: Circle,
                    animate: true
                };
            default:
                return {
                    label: 'Not Started',
                    color: 'text-zinc-500',
                    bg: 'bg-zinc-500/10',
                    border: 'border-zinc-500/20',
                    icon: Clock
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <Card className={`border-l-4 ${config.border}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Assessment Status</CardTitle>
                <Badge variant="outline" className={`${config.bg} ${config.color} border-0`}>
                    <Icon className={`h-3 w-3 mr-1 ${config.animate ? 'animate-pulse' : ''}`} />
                    {config.label}
                </Badge>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Scheduled Date</p>
                        <p className="text-sm font-semibold">{scheduledDate || 'Not Scheduled'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Estimated Duration</p>
                        <p className="text-sm font-semibold">{duration || '15 mins'}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
