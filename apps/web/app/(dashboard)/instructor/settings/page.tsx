"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Bell, Sliders, Save } from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
    const handleSave = () => {
        toast.success("Settings saved successfully!")
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your preferences and account</p>
            </div>

            <Tabs defaultValue="profile">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="notifications">
                        <Bell className="mr-2 h-4 w-4" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="grading">
                        <Sliders className="mr-2 h-4 w-4" />
                        Grading
                    </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your personal details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input id="firstName" defaultValue="John" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input id="lastName" defaultValue="Smith" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" defaultValue="john.smith@university.edu" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" defaultValue="Dr." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Input id="department" defaultValue="Computer Science" />
                            </div>
                            <Button onClick={handleSave}>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>Update your account password</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input id="currentPassword" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input id="newPassword" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input id="confirmPassword" type="password" />
                            </div>
                            <Button onClick={handleSave}>Update Password</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Email Notifications</CardTitle>
                            <CardDescription>Choose what notifications you receive via email</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">New Submissions</p>
                                    <p className="text-sm text-muted-foreground">Get notified when students submit assignments</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Plagiarism Alerts</p>
                                    <p className="text-sm text-muted-foreground">Receive alerts for flagged plagiarism cases</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Student Messages</p>
                                    <p className="text-sm text-muted-foreground">Get notified of new messages from students</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Assignment Deadlines</p>
                                    <p className="text-sm text-muted-foreground">Reminders for upcoming assignment deadlines</p>
                                </div>
                                <Switch />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Weekly Summary</p>
                                    <p className="text-sm text-muted-foreground">Receive a weekly summary of class activity</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Button onClick={handleSave}>
                                <Save className="mr-2 h-4 w-4" />
                                Save Preferences
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Grading Tab */}
                <TabsContent value="grading" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Grading Defaults</CardTitle>
                            <CardDescription>Set default preferences for grading and rubrics</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="passingGrade">Passing Grade (%)</Label>
                                <Input id="passingGrade" type="number" defaultValue="60" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="latePolicy">Late Submission Penalty (% per day)</Label>
                                <Input id="latePolicy" type="number" defaultValue="10" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Auto-grade by default</p>
                                    <p className="text-sm text-muted-foreground">Enable auto-grading for new assignments</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Enable CIPAS by default</p>
                                    <p className="text-sm text-muted-foreground">Run plagiarism detection on all submissions</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Enable AI Assistance</p>
                                    <p className="text-sm text-muted-foreground">Allow students to use AI chatbot by default</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxResubmissions">Default Max Resubmissions</Label>
                                <Input id="maxResubmissions" type="number" defaultValue="3" />
                            </div>
                            <Button onClick={handleSave}>
                                <Save className="mr-2 h-4 w-4" />
                                Save Defaults
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
