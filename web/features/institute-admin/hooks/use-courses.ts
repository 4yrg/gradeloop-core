import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesService } from "../api/courses-service";
import { Course } from "../types";

export const useCourses = () => {
    return useQuery({
        queryKey: ["courses"],
        queryFn: coursesService.getCourses,
    });
};
