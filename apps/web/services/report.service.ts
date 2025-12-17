const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const reportService = {
    getPlagiarismTrends: async () => {
        await delay(1000)
        return [
            { month: 'Jan', codeSimilarity: 65, aiDetection: 40 },
            { month: 'Feb', codeSimilarity: 59, aiDetection: 30 },
            { month: 'Mar', codeSimilarity: 80, aiDetection: 55 },
            { month: 'Apr', codeSimilarity: 81, aiDetection: 60 },
            { month: 'May', codeSimilarity: 56, aiDetection: 45 },
            { month: 'Jun', codeSimilarity: 55, aiDetection: 35 },
            { month: 'Jul', codeSimilarity: 40, aiDetection: 25 },
        ]
    },

    getUsageStats: async () => {
        await delay(800)
        return [
            { name: 'Active Students', value: 450 },
            { name: 'Active Instructors', value: 35 },
            { name: 'Submissions (Today)', value: 125 },
            { name: 'IDE Sessions', value: 890 },
        ]
    },

    getDepartmentPerformance: async () => {
        await delay(1200)
        return [
            { department: 'Computer Science', avgScore: 85, submissionRate: 92 },
            { department: 'Software Engineering', avgScore: 88, submissionRate: 95 },
            { department: 'Info Systems', avgScore: 82, submissionRate: 88 },
            { department: 'Cyber Security', avgScore: 84, submissionRate: 90 },
        ]
    }
}
