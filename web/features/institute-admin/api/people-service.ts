import { Person } from "../types";
import { MOCK_PEOPLE } from "../data/mock-people";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const peopleService = {
    getPeople: async (): Promise<Person[]> => {
        await delay(500);
        return [...MOCK_PEOPLE];
    },

    createPerson: async (data: Omit<Person, "id">): Promise<Person> => {
        await delay(800);
        return {
            ...data,
            id: Math.random().toString(36).substring(2, 9),
        };
    },

    updatePerson: async (id: string, data: Partial<Person>): Promise<Person> => {
        await delay(600);
        return { id, ...(MOCK_PEOPLE.find(p => p.id === id) as Person), ...data };
    },

    deletePerson: async (id: string): Promise<void> => {
        await delay(500);
    },

    bulkCreatePeople: async (data: Omit<Person, "id">[]): Promise<Person[]> => {
        await delay(1500);
        return data.map(p => ({
            ...p,
            id: Math.random().toString(36).substring(2, 9)
        }));
    }
};
