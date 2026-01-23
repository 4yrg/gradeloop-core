
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { semestersService } from "../api/semesters-service";
import { Semester } from "../types";

export const useSemesters = () => {
    return useQuery({
        queryKey: ["semesters"],
        queryFn: semestersService.getSemesters,
    });
};

export const useCreateSemester = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: semestersService.createSemester,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["semesters"] });
        },
    });
};

export const useUpdateSemester = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Semester> }) =>
            semestersService.updateSemester(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["semesters"] });
        },
    });
};

export const useDeleteSemester = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: semestersService.deleteSemester,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["semesters"] });
        },
    });
};

export const useSetActiveSemester = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: semestersService.setActiveSemester,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["semesters"] });
        },
    });
};

// Relationship Hooks

export const useSemesterCourses = (semesterId: string | null) => {
    return useQuery({
        queryKey: ["semester-courses", semesterId],
        queryFn: () => semestersService.getCoursesForSemester(semesterId!),
        enabled: !!semesterId,
    });
};

export const useAddCourseToSemester = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ semesterId, courseId }: { semesterId: string; courseId: string }) =>
            semestersService.addCourseToSemester(semesterId, courseId),
        onSuccess: (_, { semesterId }) => {
            queryClient.invalidateQueries({ queryKey: ["semester-courses", semesterId] });
        },
    });
};

export const useRemoveCourseFromSemester = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ semesterId, courseId }: { semesterId: string; courseId: string }) =>
            semestersService.removeCourseFromSemester(semesterId, courseId),
        onSuccess: (_, { semesterId }) => {
            queryClient.invalidateQueries({ queryKey: ["semester-courses", semesterId] });
        },
    });
};
