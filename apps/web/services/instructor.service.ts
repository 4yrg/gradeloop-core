import { Classroom, PendingSubmission, PlagiarismFlag } from "@/types/instructor"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const instructorService = {
    getClasses: async (): Promise<Classroom[]> => {
        await delay(1000)
        return [
            {
                id: '1',
                code: 'CS101',
                name: 'Intro to CS',
                semester: 'Fall 2024',
                studentCount: 120,
                activeAssignments: 2,
                nextClass: 'Mon 10:00 AM'
            },
            {
                id: '2',
                code: 'SE201',
                name: 'Software Engineering',
                semester: 'Fall 2024',
                studentCount: 85,
                activeAssignments: 1,
                nextClass: 'Tue 02:00 PM'
            },
            {
                id: '3',
                code: 'DSA202',
                name: 'Data Structures',
                semester: 'Fall 2024',
                studentCount: 95,
                activeAssignments: 3,
                nextClass: 'Wed 09:00 AM'
            }
        ]
    },

    getPendingSubmissions: async (): Promise<PendingSubmission[]> => {
        await delay(800)
        return [
            {
                id: '1',
                studentName: 'Alice Johnson',
                assignmentTitle: 'Assignment 1: Array Manipulation',
                courseCode: 'CS101',
                submittedAt: '2024-12-16T14:30:00'
            },
            {
                id: '2',
                studentName: 'Bob Smith',
                assignmentTitle: 'Project Proposal',
                courseCode: 'SE201',
                submittedAt: '2024-12-16T18:45:00'
            },
            {
                id: '3',
                studentName: 'Charlie Davis',
                assignmentTitle: 'Assignment 1: Array Manipulation',
                courseCode: 'CS101',
                submittedAt: '2024-12-17T09:15:00'
            }
        ]
    },

    getPlagiarismFlags: async (): Promise<PlagiarismFlag[]> => {
        await delay(1200)
        return [
            {
                id: '1',
                studentName: 'David Lee',
                assignmentTitle: 'Assignment 1',
                courseCode: 'CS101',
                similarityScore: 85,
                matchedSource: 'GitHub Repo'
            },
            {
                id: '2',
                studentName: 'Eve Wilson',
                assignmentTitle: 'Assignment 3',
                courseCode: 'DSA202',
                similarityScore: 92,
                matchedSource: 'Student: Alice Johnson'
            }
        ]
    }
}
