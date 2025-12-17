import { create } from 'zustand'

interface InstructorState {
    selectedClassId: string | null
    selectedAssignmentId: string | null
    selectedSubmissionId: string | null
    selectedSemester: string

    // Actions
    setSelectedClass: (id: string | null) => void
    setSelectedAssignment: (id: string | null) => void
    setSelectedSubmission: (id: string | null) => void
    setSelectedSemester: (semester: string) => void
}

export const useInstructorStore = create<InstructorState>((set) => ({
    selectedClassId: null,
    selectedAssignmentId: null,
    selectedSubmissionId: null,
    selectedSemester: '2024/2025 - Semester 1',

    setSelectedClass: (id) => set({ selectedClassId: id }),
    setSelectedAssignment: (id) => set({ selectedAssignmentId: id }),
    setSelectedSubmission: (id) => set({ selectedSubmissionId: id }),
    setSelectedSemester: (semester) => set({ selectedSemester: semester }),
}))
