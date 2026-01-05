import { useMutation, useQueryClient } from "@tanstack/react-query";
import { instituteApi } from "../../api/institute.api";
import { instituteKeys } from "./keys";

export const useDeleteInstitute = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => instituteApi.deleteInstitute(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: instituteKeys.lists() });
        },
    });
};
