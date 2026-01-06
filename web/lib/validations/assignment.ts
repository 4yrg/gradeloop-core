import { z } from "zod";

export const assignmentTypeSchema = z.enum(["Lab", "Exam", "Demo"]);

export const createAssignmentSchema = z.object({
    type: assignmentTypeSchema,
    name: z.string().min(1, "Assignment name is required"),
    autograderPoints: z.number().min(0).optional().default(100),
    allowManualGrading: z.boolean().optional().default(false),
    releaseDate: z.date({
        message: "Release date is required",
    }),
    dueDate: z.date({
        message: "Due date is required",
    }),
    allowLateSubmissions: z.boolean().optional().default(false),
    lateDueDate: z.date().optional(),
    enforceTimeLimit: z.boolean().optional().default(false),
    timeLimit: z.number().min(1).optional(),
    enableGroupSubmissions: z.boolean().optional().default(false),
    groupSizeLimit: z.number().min(1).optional(),
    enableLeaderboard: z.boolean().optional().default(false),
    leaderboardEntries: z.number().min(1).optional(),
});

export type CreateAssignmentValues = z.infer<typeof createAssignmentSchema>;
