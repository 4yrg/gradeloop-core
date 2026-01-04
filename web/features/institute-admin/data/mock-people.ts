import { Person } from "../types";

export const MOCK_PEOPLE: Person[] = [
    {
        id: "1",
        firstName: "Alice",
        lastName: "Admin",
        email: "alice@institute.edu",
        role: "institute_admin",
    },
    {
        id: "2",
        firstName: "Bob",
        lastName: "Instructor",
        email: "bob@institute.edu",
        role: "instructor",
    },
    {
        id: "3",
        firstName: "Charlie",
        lastName: "Student",
        email: "charlie@student.institute.edu",
        role: "student",
        studentId: "S12345",
    },
    {
        id: "4",
        firstName: "Diana",
        lastName: "Student",
        email: "diana@student.institute.edu",
        role: "student",
        studentId: "S67890",
    }
];
