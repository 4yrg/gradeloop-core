import { useQuery } from "@tanstack/react-query";
import { instituteApi } from "../../api/institute.api";
import { instituteKeys } from "./keys";

export const useInstituteLogs = (id: string) => {
    return useQuery({
        queryKey: instituteKeys.logs(id),
        queryFn: () => instituteApi.getActivityLogs(id),
        enabled: !!id,
    });
};

export const useInstituteSetup = (id: string) => {
    return useQuery({
        queryKey: instituteKeys.setup(id),
        queryFn: () => instituteApi.getSetupSteps(id),
        enabled: !!id,
    });
};
