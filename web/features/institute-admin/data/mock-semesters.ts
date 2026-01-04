import { Semester } from "../types";

export const MOCK_SEMESTERS: Semester[] = [
    {
        id: "1",
        term: "Spring",
        year: 2024,
        startDate: "2024-01-15T00:00:00Z",
        endDate: "2024-05-15T00:00:00Z",
        isActive: true,
    },
    {
        id: "2",
        term: "Fall",
        year: 2023,
        startDate: "2023-08-20T00:00:00Z",
        endDate: "2023-12-15T00:00:00Z",
        isActive: false,
    },
    {
        id: "3",
        term: "Summer",
        year: 2024,
        startDate: "2024-06-01T00:00:00Z",
        endDate: "2024-08-10T00:00:00Z",
        isActive: false,
    }
];
