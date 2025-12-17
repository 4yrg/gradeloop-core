import { PlagiarismReport } from "@/types/cipas"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const cipasService = {
    getClassReports: async (classId: string): Promise<PlagiarismReport[]> => {
        await delay(1000)
        return [
            {
                id: '1',
                studentId: 's1',
                studentName: 'David Lee',
                assignmentId: 'a1',
                assignmentTitle: 'Assignment 1: Array Manipulation',
                totalSimilarity: 85,
                matchedSources: [
                    {
                        sourceId: 'r1',
                        sourceName: 'GitHub: algo-solutions',
                        similarity: 85,
                        cloneType: 'Type 1',
                        linesMatched: [1, 2, 3, 4, 10, 15]
                    },
                    {
                        sourceId: 's2',
                        sourceName: 'Student: Alice Johnson',
                        similarity: 45,
                        cloneType: 'Type 3',
                        linesMatched: [50, 51, 52]
                    }
                ],
                status: 'Flagged'
            },
            {
                id: '2',
                studentId: 's3',
                studentName: 'Eve Wilson',
                assignmentId: 'a3',
                assignmentTitle: 'Mid-term Project',
                totalSimilarity: 92,
                matchedSources: [
                    {
                        sourceId: 's1',
                        sourceName: 'Student: David Lee',
                        similarity: 90,
                        cloneType: 'Type 2',
                        linesMatched: [100, 101, 102]
                    }
                ],
                status: 'Reviewing'
            },
            {
                id: '3',
                studentId: 's4',
                studentName: 'Frank Miller',
                assignmentId: 'a1',
                assignmentTitle: 'Assignment 1: Array Manipulation',
                totalSimilarity: 12,
                matchedSources: [],
                status: 'Resolved'
            }
        ]
    },

    updateStatus: async (reportId: string, status: PlagiarismReport['status']) => {
        await delay(500)
        console.log(`Updated report ${reportId} to ${status}`)
        return true
    }
}
