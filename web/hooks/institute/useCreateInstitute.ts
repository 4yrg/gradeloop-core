import { useMutation, useQueryClient } from "@tanstack/react-query";
import { instituteApi } from "../../api/institute.api";
import { Institute } from "../../features/system-admin/types";
import { instituteKeys } from "./keys";

export const useCreateInstitute = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Institute>) => instituteApi.createInstitute(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: instituteKeys.lists() });
        },
    });
};
