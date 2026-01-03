import { ClassGroup } from "../types";

export const MOCK_CLASSES: ClassGroup[] = [
    // Degree 1: Comp Sci
    {
        id: "class-freshman-24",
        name: "Freshman Cohort 2024",
        degreeId: "1",
        studentCount: 145,
    },
    {
        id: "class-sophomore-23",
        name: "Sophomore Cohort 2023",
        degreeId: "1",
        studentCount: 132,
    },
    {
        id: "class-junior-22",
        name: "Junior Cohort 2022",
        degreeId: "1",
        studentCount: 118,
    },
    {
        id: "class-senior-21+2",
        name: "Senior Cohort 2021",
        degreeId: "1",
        studentCount: 98,
    },

    // Degree 2: IT (BS-IT)
    {
        id: "class-it-24",
        name: "IT Cohort 2024",
        degreeId: "2",
        studentCount: 55,
    },
    {
        id: "class-it-23",
        name: "IT Cohort 2023",
        degreeId: "2",
        studentCount: 48,
    },

    // Degree 3: Data Science
    {
        id: "class-ds-24",
        name: "Data Science Batch 2024",
        degreeId: "3",
        studentCount: 60,
    },
    {
        id: "class-ds-23",
        name: "Data Science Batch 2023",
        degreeId: "3",
        studentCount: 55,
    },

    // Unassigned / General
    {
        id: "class-gen-1",
        name: "Audit Students - Fall",
        degreeId: "3",
        studentCount: 12,
    },
];
