import { useQuery } from "@tanstack/react-query";
import { instituteApi } from "../../api/institute.api";
import { instituteKeys } from "./keys";

export const useInstitutes = () => {
    return useQuery({
        queryKey: instituteKeys.lists(),
        queryFn: () => instituteApi.getInstitutes(),
    });
};

export const useInstitute = (id: string) => {
    return useQuery({
        queryKey: instituteKeys.detail(id),
        queryFn: () => instituteApi.getInstituteById(id),
        enabled: !!id,
    });
};
