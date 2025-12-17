const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export interface ExecutionResult {
    output: string
    error?: string
    success: boolean
}

export interface TestCaseResult {
    id: string
    name: string
    status: 'passed' | 'failed'
    expected: string
    actual: string
}

export const ideService = {
    runCode: async (code: string): Promise<ExecutionResult> => {
        await delay(1500)

        // Mock simulation of compilation/runtime
        if (code.includes('System.out.println("Hello World")')) {
            return { output: 'Hello World\n', success: true }
        }

        if (code.includes('fail')) {
            return { output: '', error: 'Exception in thread "main" java.lang.RuntimeException: mock failure', success: false }
        }

        return { output: 'Program executed successfully.\nOutput: [Mock Output]', success: true }
    },

    submitAssignment: async (code: string): Promise<{ score: number, results: TestCaseResult[] }> => {
        await delay(2000)

        // Mock submission
        return {
            score: 85,
            results: [
                { id: '1', name: 'Test Case 1', status: 'passed', expected: '10', actual: '10' },
                { id: '2', name: 'Test Case 2', status: 'passed', expected: 'Hello', actual: 'Hello' },
                { id: '3', name: 'Test Case 3', status: 'failed', expected: 'Sorted array', actual: 'Unsorted array' },
            ]
        }
    }
}
