import { useMutation, useQueryClient } from "@tanstack/react-query";
import { instituteApi } from "../../api/institute.api";
import { instituteKeys } from "./keys";

export const useAddAdmin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (vars: { instituteId: string; data: { name: string; email: string; role: 'owner' | 'admin' } }) =>
            instituteApi.addAdmin(vars.instituteId, vars.data),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: instituteKeys.detail(vars.instituteId) });
            queryClient.invalidateQueries({ queryKey: instituteKeys.lists() });
        },
    });
};
