export interface Classroom {
    id: string
    code: string
    name: string
    semester: string
    studentCount: number
    activeAssignments: number
    nextClass: string
}

export interface PendingSubmission {
    id: string
    studentName: string
    studentAvatar?: string
    assignmentTitle: string
    submittedAt: string
    courseCode: string
}

export interface PlagiarismFlag {
    id: string
    studentName: string
    assignmentTitle: string
    similarityScore: number
    matchedSource: string
    courseCode: string
}
