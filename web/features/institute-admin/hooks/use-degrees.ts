import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { degreesService } from "../api/degrees-service";
import { Degree } from "../types";

export const useDegrees = () => {
    return useQuery({
        queryKey: ["degrees"],
        queryFn: degreesService.getDegrees,
    });
};

export const useDegree = (id: string) => {
    return useQuery({
        queryKey: ["degrees", id],
        queryFn: () => degreesService.getDegreeById(id),
        enabled: !!id,
    });
};

export const useCreateDegree = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: degreesService.createDegree,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["degrees"] });
        },
    });
};

export const useUpdateDegree = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Degree> }) =>
            degreesService.updateDegree(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["degrees"] });
        },
    });
};

export const useDeleteDegree = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: degreesService.deleteDegree,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["degrees"] });
        },
    });
};

// Relationship Hooks

export const useDegreeCourses = (degreeId: string | null) => {
    return useQuery({
        queryKey: ["degree-courses", degreeId],
        queryFn: () => degreesService.getCoursesForDegree(degreeId!),
        enabled: !!degreeId,
    });
};

export const useAddCourseToDegree = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ degreeId, courseId }: { degreeId: string; courseId: string }) =>
            degreesService.addCourseToDegree(degreeId, courseId),
        onSuccess: (_, { degreeId }) => {
            queryClient.invalidateQueries({ queryKey: ["degree-courses", degreeId] });
        },
    });
};

export const useRemoveCourseFromDegree = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ degreeId, courseId }: { degreeId: string; courseId: string }) =>
            degreesService.removeCourseFromDegree(degreeId, courseId),
        onSuccess: (_, { degreeId }) => {
            queryClient.invalidateQueries({ queryKey: ["degree-courses", degreeId] });
        },
    });
};
