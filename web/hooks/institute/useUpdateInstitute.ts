import { useMutation, useQueryClient } from "@tanstack/react-query";
import { instituteApi } from "../../api/institute.api";
import { Institute } from "../../features/system-admin/types";
import { instituteKeys } from "./keys";

export const useUpdateInstitute = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Institute> }) =>
            instituteApi.updateInstitute(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: instituteKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: instituteKeys.lists() });
        },
    });
};
