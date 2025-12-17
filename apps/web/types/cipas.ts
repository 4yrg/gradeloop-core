export type CloneType = 'Type 1' | 'Type 2' | 'Type 3' | 'Type 4'

export interface PlagiarismReport {
    id: string
    studentId: string
    studentName: string
    assignmentId: string
    assignmentTitle: string
    totalSimilarity: number
    matchedSources: {
        sourceId: string
        sourceName: string
        similarity: number
        cloneType: CloneType
        linesMatched: number[]
    }[]
    status: 'Flagged' | 'Reviewing' | 'Resolved' | 'Ignored'
}
