import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { peopleService } from "../api/people.api";
import { Person } from "../types";

export const usePeople = (role?: string) => {
    return useQuery({
        queryKey: ["people", role],
        queryFn: () => peopleService.getUsers(role),
    });
};

export const useCreatePerson = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: peopleService.createPerson,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["people"] });
        },
    });
};

export const useUpdatePerson = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Person> }) =>
            peopleService.updatePerson(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["people"] });
        },
    });
};

export const useDeletePerson = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: peopleService.deletePerson,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["people"] });
        },
    });
};
