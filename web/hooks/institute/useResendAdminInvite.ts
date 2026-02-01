import { useMutation } from "@tanstack/react-query";
import { instituteApi } from "../../api/institute.api";

export const useResendAdminInvite = () => {
    return useMutation({
        mutationFn: (vars: { instituteId: string; adminId: string }) =>
            instituteApi.resendAdminInvite(vars.instituteId, vars.adminId),
    });
};