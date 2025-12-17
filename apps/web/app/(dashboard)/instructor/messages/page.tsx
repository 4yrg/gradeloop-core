"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Inbox, Send as SendIcon, Search, Plus, User } from "lucide-react"
import { Label } from "@/components/ui/label"

export default function MessagesPage() {
    const [selectedMessage, setSelectedMessage] = useState<any>(null)
    const [composeMode, setComposeMode] = useState(false)

    const mockMessages = [
        {
            id: 1,
            from: "John Doe",
            subject: "Question about Assignment 3",
            preview: "Hi Professor, I have a question about the requirements...",
            timestamp: new Date().toISOString(),
            unread: true
        },
        {
            id: 2,
            from: "Jane Smith",
            subject: "Extension Request",
            preview: "I would like to request an extension for...",
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            unread: true
        },
        {
            id: 3,
            from: "Bob Johnson",
            subject: "Thank you for the feedback",
            preview: "Thank you for the detailed feedback on my submission...",
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            unread: false
        }
    ]

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
                    <p className="text-muted-foreground">Communicate with students and staff</p>
                </div>
                <Button onClick={() => setComposeMode(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Compose
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Message List */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search messages..." className="pl-9" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Tabs defaultValue="inbox">
                            <TabsList className="w-full">
                                <TabsTrigger value="inbox" className="flex-1">
                                    <Inbox className="mr-2 h-4 w-4" />
                                    Inbox
                                </TabsTrigger>
                                <TabsTrigger value="sent" className="flex-1">
                                    <SendIcon className="mr-2 h-4 w-4" />
                                    Sent
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="inbox" className="mt-0">
                                <div className="divide-y">
                                    {mockMessages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`p-4 cursor-pointer hover:bg-accent transition-colors ${selectedMessage?.id === message.id ? 'bg-accent' : ''
                                                }`}
                                            onClick={() => setSelectedMessage(message)}
                                        >
                                            <div className="flex items-start justify-between mb-1">
                                                <p className="font-medium text-sm">{message.from}</p>
                                                {message.unread && (
                                                    <div className="h-2 w-2 bg-blue-600 rounded-full" />
                                                )}
                                            </div>
                                            <p className="text-sm font-medium mb-1">{message.subject}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {message.preview}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {new Date(message.timestamp).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>
                            <TabsContent value="sent">
                                <div className="p-8 text-center text-muted-foreground">
                                    <SendIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>No sent messages</p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Message View / Compose */}
                <Card className="lg:col-span-2">
                    {composeMode ? (
                        <>
                            <CardHeader>
                                <CardTitle>New Message</CardTitle>
                                <CardDescription>Send a message to students or staff</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="to">To</Label>
                                    <Input id="to" placeholder="Student name or email..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input id="subject" placeholder="Message subject..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea id="message" placeholder="Type your message..." rows={10} />
                                </div>
                                <div className="flex gap-2">
                                    <Button>
                                        <SendIcon className="mr-2 h-4 w-4" />
                                        Send
                                    </Button>
                                    <Button variant="outline" onClick={() => setComposeMode(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </>
                    ) : selectedMessage ? (
                        <>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle>{selectedMessage.subject}</CardTitle>
                                        <CardDescription className="flex items-center gap-2 mt-2">
                                            <User className="h-4 w-4" />
                                            {selectedMessage.from}
                                        </CardDescription>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(selectedMessage.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-lg border bg-card">
                                    <p className="text-sm">{selectedMessage.preview}</p>
                                    <p className="text-sm mt-4">
                                        This is the full message content. In a real implementation, this would contain the complete message text.
                                    </p>
                                </div>
                                <div className="pt-4 border-t">
                                    <Label htmlFor="reply">Reply</Label>
                                    <Textarea id="reply" placeholder="Type your reply..." rows={4} className="mt-2" />
                                    <Button className="mt-2">
                                        <SendIcon className="mr-2 h-4 w-4" />
                                        Send Reply
                                    </Button>
                                </div>
                            </CardContent>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center p-12">
                            <div className="text-center text-muted-foreground">
                                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                <p>Select a message to view</p>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
