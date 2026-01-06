import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { degreesService } from "../api/degrees-service";
import { Degree } from "../types";
import { useAuthStore } from "../../../stores/auth.store";

export const useDegrees = () => {
    const { user } = useAuthStore();
    const instituteId = user?.instituteId;

    return useQuery({
        queryKey: ["degrees", instituteId],
        queryFn: () => degreesService.getDegrees(instituteId!),
        enabled: !!instituteId,
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
    const { user } = useAuthStore();
    const instituteId = user?.instituteId;

    return useMutation({
        mutationFn: (data: Omit<Degree, "id">) => degreesService.createDegree(instituteId!, data),
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
