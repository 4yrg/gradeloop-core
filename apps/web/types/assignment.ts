export type AssignmentStatus = 'Open' | 'Closed' | 'Submitted' | 'Graded' | 'Overdue'

export interface Assignment {
    id: string
    title: string
    description: string
    dueDate: string
    status: AssignmentStatus
    points: number
    courseId: string
    submissionId?: string
}
