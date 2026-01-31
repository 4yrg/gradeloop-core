import { z } from "zod";

// --- Enums ---
export const semesterTermSchema = z.enum(["Spring", "Summer", "Fall", "Winter"]);
export type SemesterTerm = z.infer<typeof semesterTermSchema>;

export const courseTypeSchema = z.enum(["Lecture", "Lab", "Seminar"]);
export type CourseType = z.infer<typeof courseTypeSchema>;

export const userRoleSchema = z.enum(["institute_admin", "instructor", "student"]);
export type UserRole = z.infer<typeof userRoleSchema>;

// --- Schemas ---

// Semesters
export const semesterSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, "Name is required"),
    code: z.string().min(1, "Code is required"),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    isActive: z.boolean().default(false),
});
export type Semester = z.infer<typeof semesterSchema>;

// Degrees
export const degreeSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2, "Name is required"),
    code: z.string().min(2, "Code is required"), // e.g., "BS-CS"
    description: z.string().optional(),
    credits: z.number().min(1, "Credits must be at least 1"),
});
export type Degree = z.infer<typeof degreeSchema>;

// Courses
export const courseSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2, "Name is required"),
    code: z.string().min(2, "Course code is required"), // e.g., "CS101"
    description: z.string().optional(),
    credits: z.number().min(0),
    department: z.string().optional(),
    degreeId: z.string().uuid().optional(), // For mock filtering
    instructorIds: z.array(z.string()).optional(),
    moduleLeaderId: z.string().optional(),
    semester: z.string().optional(),
});
export type Course = z.infer<typeof courseSchema>;

// Course Offerings (Instance of a course in a semester)
export const courseOfferingSchema = z.object({
    id: z.string().uuid().optional(),
    courseId: z.string().uuid(),
    semesterId: z.string().uuid(),
    section: z.string().optional(), // e.g., "A", "001"
    instructors: z.array(z.string().uuid()), // User IDs
});
export type CourseOffering = z.infer<typeof courseOfferingSchema>;

// People
export const personSchema = z.object({
    id: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    fullName: z.string().optional(),
    email: z.string().email(),
    role: userRoleSchema,
    studentId: z.string().optional(), // For students
    instituteId: z.string().optional(),
    department: z.string().optional(), // For instructors
});
export type Person = z.infer<typeof personSchema>;

// Classes (Cohorts/Groups under a Degree)
export const classGroupSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2, "Class name is required"), // e.g. "Class of 2025"
    degreeId: z.string().uuid(),
    studentCount: z.number().default(0),
    studentIds: z.array(z.number()).optional(),
});
export type ClassGroup = z.infer<typeof classGroupSchema>;
