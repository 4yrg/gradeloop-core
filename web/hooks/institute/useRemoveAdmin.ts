import { useMutation, useQueryClient } from "@tanstack/react-query";
import { instituteApi } from "../../api/institute.api";
import { instituteKeys } from "./keys";

export const useRemoveAdmin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (vars: { instituteId: string; adminId: string }) =>
            instituteApi.removeAdmin(vars.instituteId, vars.adminId),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: instituteKeys.detail(vars.instituteId) });
            queryClient.invalidateQueries({ queryKey: instituteKeys.lists() });
        },
    });
};