import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesService } from "../api/courses-service";
import { Course } from "../types";
import { useAuthStore } from "../../../stores/auth.store";

export const useCourses = () => {
    const { user } = useAuthStore();
    const instituteId = user?.instituteId;

    return useQuery({
        queryKey: ["courses", instituteId],
        queryFn: () => coursesService.getCourses(instituteId!),
        enabled: !!instituteId,
    });
};

export const useCourse = (id: string) => {
    return useQuery({
        queryKey: ["courses", id],
        queryFn: () => coursesService.getCourseById(id),
        enabled: !!id,
    });
};

export const useCreateCourse = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const instituteId = user?.instituteId;

    return useMutation({
        mutationFn: (data: Omit<Course, "id">) => coursesService.createCourse(instituteId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["courses"] });
        },
    });
};
