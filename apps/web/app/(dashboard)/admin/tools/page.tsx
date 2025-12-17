"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Server, Cpu, Database, Network, Terminal, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from "lucide-react"

export default function AdminToolsPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500 p-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Tools & Infrastructure</h1>
                <p className="text-muted-foreground">Manage system services, execution environments, and AI models.</p>
            </div>

            <Tabs defaultValue="runtimes" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="runtimes">Runtimes (Judge0)</TabsTrigger>
                    <TabsTrigger value="ai">AI Models (Ollama)</TabsTrigger>
                    <TabsTrigger value="storage">Storage & DB</TabsTrigger>
                    <TabsTrigger value="logs">System Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="runtimes" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
                                <Server className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">12</div>
                                <p className="text-xs text-muted-foreground">+2 from last hour</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Queue Size</CardTitle>
                                <Network className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">45</div>
                                <p className="text-xs text-muted-foreground">Jobs pending execution</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">99.8%</div>
                                <p className="text-xs text-muted-foreground">Last 24 hours</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
                                <Cpu className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">340ms</div>
                                <p className="text-xs text-muted-foreground">Per submission</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Language Environments</CardTitle>
                            <CardDescription>Configure enabled languages and compiler versions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded">
                                        <Terminal className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Java (OpenJDK 17)</p>
                                        <p className="text-sm text-muted-foreground">ID: 62 | Memory: 512MB | Timeout: 5s</p>
                                    </div>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded">
                                        <Terminal className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Python (3.11.2)</p>
                                        <p className="text-sm text-muted-foreground">ID: 71 | Memory: 256MB | Timeout: 10s</p>
                                    </div>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between p-4 border rounded-lg opacity-60">
                                <div className="flex items-center gap-4">
                                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                        <Terminal className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium">C++ (GCC 9.2.0)</p>
                                        <p className="text-sm text-muted-foreground">ID: 54 | Memory: 512MB | Timeout: 2s</p>
                                    </div>
                                </div>
                                <Switch />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ai" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>LLM Configuration</CardTitle>
                            <CardDescription>Manage connection to Ollama / Local LLM provider.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Endpoint URL</Label>
                                <div className="flex gap-2">
                                    <Input defaultValue="http://localhost:11434" />
                                    <Button variant="outline">Test Connection</Button>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium">Loaded Models</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between bg-muted/40 p-3 rounded-md">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-sm font-medium">llama3:latest</span>
                                            <span className="text-xs text-muted-foreground">4.1GB • Modified 2 hours ago</span>
                                        </div>
                                        <Badge variant="default" className="bg-green-600">Active</Badge>
                                    </div>
                                    <div className="flex items-center justify-between bg-muted/40 p-3 rounded-md">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-sm font-medium">deepseek-coder:6.7b</span>
                                            <span className="text-xs text-muted-foreground">8.2GB • Modified 5 days ago</span>
                                        </div>
                                        <Badge variant="secondary">Idle</Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full">Save Configuration</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="storage" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Database & Object Storage</CardTitle>
                            <CardDescription>Monitor Supabase / PostgreSQL status.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Database Storage</span>
                                    <span className="text-muted-foreground">4.2 GB / 10 GB</span>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-[42%]" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Artifact Storage (S3)</span>
                                    <span className="text-muted-foreground">12.8 GB / 50 GB</span>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[25%]" />
                                </div>
                            </div>

                            <Separator />

                            <div className="flex items-center gap-4">
                                <Database className="h-8 w-8 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Connection Pool</p>
                                    <p className="text-sm text-muted-foreground">Active Connections: 18/60</p>
                                </div>
                                <Button variant="outline" size="sm" className="ml-auto">
                                    <RefreshCw className="mr-2 h-3 w-3" /> Reset Pool
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="logs">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Logs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-black text-green-400 font-mono text-xs p-4 rounded-md h-[400px] overflow-y-auto">
                                <p>[INFO] 2024-10-24 10:15:22 - Server started on port 3000</p>
                                <p>[INFO] 2024-10-24 10:15:23 - Connected to Database</p>
                                <p>[INFO] 2024-10-24 10:16:05 - Job processing worker #1 initialized</p>
                                <p>[WARN] 2024-10-24 10:22:11 - High latency detected in auth middleware (1200ms)</p>
                                <p>[INFO] 2024-10-24 10:30:00 - Scheduled maintenance task: "Cleanup Temp Files" started</p>
                                <p>[INFO] 2024-10-24 10:30:02 - Scheduled maintenance task: "Cleanup Temp Files" completed (200ms)</p>
                                <p>[ERROR] 2024-10-24 11:05:43 - Failed to fetch submission artifacts for SUB-8821: 404 Not Found</p>
                                <p>[INFO] 2024-10-24 11:05:43 - Retry attemp 1/3 for SUB-8821...</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
