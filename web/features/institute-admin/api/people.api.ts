import { apiClient } from "@/api/client";
import { Person } from "../types";

export const peopleService = {
    getUsers: async (role?: string): Promise<Person[]> => {
        let endpoint = "/users";
        if (role === "student") {
            endpoint = "/users/students";
        } else if (role === "instructor") {
            endpoint = "/users/instructors";
        }

        // If we are hitting the generic /users endpoint, we might still want to pass the role just in case
        const query = role && endpoint === "/users" ? `?role=${role}` : "";

        const response = await apiClient.get<Person[]>(`${endpoint}${query}`);
        return response.data;
    },

    createPerson: async (data: Omit<Person, "id">): Promise<Person> => {
        // Determine endpoint based on role
        const endpoint = data.role === "student" ? "/users/students" :
            data.role === "instructor" ? "/users/instructors" :
                "/users/admins"; // Default or specific for admins

        const response = await apiClient.post<Person>(endpoint, data);
        return response.data;
    },

    updatePerson: async (id: string, data: Partial<Person>): Promise<Person> => {
        const response = await apiClient.put<Person>(`/users/${id}`, data);
        return response.data;
    },

    deletePerson: async (id: string): Promise<void> => {
        await apiClient.delete(`/users/${id}`);
    }
};
