import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { peopleService } from "../api/people.api";
import { Person } from "../types";

export const usePeople = (role?: string) => {
    return useQuery({
        queryKey: ["people", role],
        queryFn: () => peopleService.getPeople(role),
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
        mutationFn: ({ id, role, data }: { id: string; role: string; data: Partial<Person> }) =>
            peopleService.updatePerson(id, role, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["people"] });
        },
    });
};

export const useDeletePerson = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, role }: { id: string; role: string }) =>
            peopleService.deletePerson(id, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["people"] });
        },
    });
};

export const useBulkCreatePeople = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ role, data }: { role: string; data: any[] }) =>
            peopleService.bulkCreatePeople(role, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["people"] });
        },
    });
};
