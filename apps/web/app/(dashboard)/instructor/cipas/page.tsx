"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ShieldAlert, FileSearch, gitCommit, AlertOctagon } from "lucide-react"

// If you have recharts, you can import charts here.
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
    { name: 'Lab 1', clones: 12 },
    { name: 'Lab 2', clones: 25 },
    { name: 'Project 1', clones: 5 },
    { name: 'Midterm', clones: 2 },
]

export default function CIPASDashboard() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">CIPAS Analysis</h1>
                <p className="text-muted-foreground">Code Internal Plagiarism analysis System.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Flagged Submissions</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">42</div>
                        <p className="text-xs text-muted-foreground">+12% from last semester</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Similarity Score</CardTitle>
                        <FileSearch className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">18%</div>
                        <p className="text-xs text-muted-foreground">Threshold: 45%</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Violation Type</CardTitle>
                        <AlertOctagon className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Type 3</div>
                        <p className="text-xs text-muted-foreground">Variable renaming / Reordering</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Plagiarism Trends</CardTitle>
                        <CardDescription>Detected clones per assignment</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
                                    cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                                />
                                <Bar dataKey="clones" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Latest Alerts */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Recent Alerts</CardTitle>
                        <CardDescription>High probability matches detected recently.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-start gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full text-red-600">
                                    <ShieldAlert className="h-4 w-4" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">Lab 2: Loops & Arrays</h4>
                                    <p className="text-xs text-muted-foreground">Details: Alice Cooper vs Bob Smith (98% match)</p>
                                    <div className="mt-2 flex gap-2">
                                        <span className="text-[10px] bg-secondary px-2 py-0.5 rounded border">Type 3 Clone</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
