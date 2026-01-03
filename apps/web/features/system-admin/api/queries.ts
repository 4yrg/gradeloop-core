import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { instituteService } from "./institute-service";
import { Institute } from "../types";

export const instituteKeys = {
    all: ["institutes"] as const,
    lists: () => [...instituteKeys.all, "list"] as const,
    list: (filters: any) => [...instituteKeys.lists(), { filters }] as const,
    details: () => [...instituteKeys.all, "detail"] as const,
    detail: (id: string) => [...instituteKeys.details(), id] as const,
    logs: (id: string) => [...instituteKeys.all, "logs", id] as const,
    setup: (id: string) => [...instituteKeys.all, "setup", id] as const,
};

export const useInstitutes = () => {
    return useQuery({
        queryKey: instituteKeys.lists(),
        queryFn: () => instituteService.getInstitutes(),
    });
};

export const useInstitute = (id: string) => {
    return useQuery({
        queryKey: instituteKeys.detail(id),
        queryFn: () => instituteService.getInstituteById(id),
        enabled: !!id,
    });
};

export const useCreateInstitute = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Institute>) => instituteService.createInstitute(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: instituteKeys.lists() });
        },
    });
};

export const useUpdateInstitute = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Institute>) => instituteService.updateInstitute(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: instituteKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: instituteKeys.lists() });
        },
    });
};

export const useInstituteLogs = (id: string) => {
    return useQuery({
        queryKey: instituteKeys.logs(id),
        queryFn: () => instituteService.getActivityLogs(id),
        enabled: !!id,
    });
};

export const useInstituteSetup = (id: string) => {
    return useQuery({
        queryKey: instituteKeys.setup(id),
        queryFn: () => instituteService.getSetupSteps(id),
        enabled: !!id,
    });
};
