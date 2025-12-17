"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { StudentService } from "@/services/student.service"
import { CalendarEvent } from "@/services/mocks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Clock, CalendarDays } from "lucide-react"

export default function StudentCalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date())

    const { data: events, isLoading } = useQuery({
        queryKey: ['calendar-events'],
        queryFn: StudentService.getCalendarEvents
    })

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        return new Date(year, month + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        return new Date(year, month, 1).getDay()
    }

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }

    const getEventsForDay = (day: number) => {
        if (!events) return []
        return events.filter(e => {
            const eDate = new Date(e.date)
            return eDate.getDate() === day &&
                eDate.getMonth() === currentDate.getMonth() &&
                eDate.getFullYear() === currentDate.getFullYear()
        })
    }

    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const emptyDays = Array.from({ length: firstDay }, (_, i) => i)

    const monthName = currentDate.toLocaleString('default', { month: 'long' })
    const year = currentDate.getFullYear()

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
                    <p className="text-muted-foreground">Keep track of your deadlines and sessions.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-semibold min-w-[200px] text-center">
                        {monthName} {year}
                    </h2>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    <Card className="h-full">
                        <CardHeader className="pb-2">
                            <div className="grid grid-cols-7 text-center text-sm font-medium text-muted-foreground mb-2">
                                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden border border-muted">
                                {emptyDays.map(i => (
                                    <div key={`empty-${i}`} className="bg-background h-32 md:h-40 p-2 opacity-50" />
                                ))}
                                {days.map(day => {
                                    const dayEvents = getEventsForDay(day)
                                    const isToday = new Date().getDate() === day &&
                                        new Date().getMonth() === currentDate.getMonth() &&
                                        new Date().getFullYear() === currentDate.getFullYear()

                                    return (
                                        <div key={day} className={`bg-background h-32 md:h-40 p-2 hover:bg-muted/30 transition-colors flex flex-col gap-1 ${isToday ? 'bg-blue-50/30' : ''}`}>
                                            <div className="flex justify-between items-center">
                                                <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : ''}`}>
                                                    {day}
                                                </span>
                                                {dayEvents.length > 0 && (
                                                    <span className="text-[10px] text-muted-foreground">{dayEvents.length} items</span>
                                                )}
                                            </div>
                                            <div className="flex-1 overflow-y-auto space-y-1 mt-1 pr-1 custom-scrollbar">
                                                {dayEvents.map(event => (
                                                    <div key={event.id} className={`text-[10px] p-1.5 rounded border border-l-2 truncate cursor-pointer hover:opacity-80
                                                        ${event.type === 'assignment' ? 'bg-red-50 border-red-200 border-l-red-500 text-red-700 dark:bg-red-900/10 dark:border-red-900 dark:text-red-300' : ''}
                                                        ${event.type === 'exam' ? 'bg-purple-50 border-purple-200 border-l-purple-500 text-purple-700' : ''}
                                                        ${event.type === 'session' ? 'bg-blue-50 border-blue-200 border-l-blue-500 text-blue-700 dark:bg-blue-900/10 dark:border-blue-900 dark:text-blue-300' : ''}
                                                    `}>
                                                        {event.title}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Upcoming Events</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isLoading ? (
                                <div className="space-y-2">
                                    <div className="h-12 bg-muted rounded animate-pulse" />
                                    <div className="h-12 bg-muted rounded animate-pulse" />
                                </div>
                            ) : events?.slice(0, 5).map(event => (
                                <div key={event.id} className="flex gap-3 items-start border-b last:border-0 pb-3 last:pb-0">
                                    <div className="mt-1 p-2 rounded-full bg-muted">
                                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{event.title}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(event.date).toLocaleDateString()}
                                        </p>
                                        {event.description && (
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{event.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Legend</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-sm" /> <span>Assignment Due</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-sm" /> <span>Class Session</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-purple-500 rounded-sm" /> <span>Exam / Quiz</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
