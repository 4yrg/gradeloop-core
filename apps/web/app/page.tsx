"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Code, GraduationCap, BookOpen, Shield } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <Code className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Welcome to GradeLoop</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            An intelligent Learning Management System with AI-powered assessment and plagiarism detection
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Student */}
          <Card className="hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                <GraduationCap className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Student Portal</CardTitle>
              <CardDescription>
                Access courses, submit assignments, and track your progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href="/student">
                  Enter as Student
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Instructor */}
          <Card className="hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Instructor Portal</CardTitle>
              <CardDescription>
                Manage classes, create assignments, and grade submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href="/instructor">
                  Enter as Instructor
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Admin */}
          <Card className="hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Admin Portal</CardTitle>
              <CardDescription>
                System administration and user management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href="/admin">
                  Enter as Admin
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="text-center pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">Key Features</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <span className="px-3 py-1 rounded-full bg-muted">AI-Powered Grading</span>
            <span className="px-3 py-1 rounded-full bg-muted">Plagiarism Detection</span>
            <span className="px-3 py-1 rounded-full bg-muted">Code Analysis</span>
            <span className="px-3 py-1 rounded-full bg-muted">Real-time Feedback</span>
          </div>
        </div>
      </div>
    </div>
  )
}
