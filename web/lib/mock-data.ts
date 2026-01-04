export const mockCourse = {
    id: "IT1010",
    name: "Database Management Systems",
    semester: "Year 1 Semester 2",
    degree: "IT",
    specialization: "SE",
    code: "IT1010",
    description: "Introduction to relational databases, SQL, and database design principles. This course covers everything from basic querying to advanced database architecture and optimization.",
    objectives: [
        "Understand relational database models",
        "Master SQL for data manipulation and definition",
        "Design efficient database schemas",
        "Explain transaction management and concurrency control"
    ]
};

export const mockAssignments = [
    {
        id: "1",
        name: "Assignment 1: SQL Lab",
        released: "2023-10-01",
        due: "2023-10-15",
        submissions: 45,
        graded: "100%",
        published: true,
        regrades: 2,
    },
    {
        id: "2",
        name: "Assignment 2: Database Design",
        released: "2023-11-01",
        due: "2023-11-15",
        submissions: 42,
        graded: "85%",
        published: true,
        regrades: 0,
    },
    {
        id: "3",
        name: "Final Project",
        released: "2023-12-01",
        due: "2023-12-20",
        submissions: 30,
        graded: "0%",
        published: false,
        regrades: 0,
    }
];
