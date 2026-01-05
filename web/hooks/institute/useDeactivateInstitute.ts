import { useMutation, useQueryClient } from "@tanstack/react-query";
import { instituteApi } from "../../api/institute.api";
import { instituteKeys } from "./keys";

export const useDeactivateInstitute = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => instituteApi.deactivateInstitute(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: instituteKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: instituteKeys.lists() });
        },
    });
};
