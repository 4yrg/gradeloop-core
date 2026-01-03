import { z } from "zod";

export const instituteStatusSchema = z.enum(["active", "inactive", "pending"]);
export type InstituteStatus = z.infer<typeof instituteStatusSchema>;

export const instituteAdminRoleSchema = z.enum(["owner", "admin"]);
export type InstituteAdminRole = z.infer<typeof instituteAdminRoleSchema>;

export const instituteAdminSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    role: instituteAdminRoleSchema,
});

export type InstituteAdmin = z.infer<typeof instituteAdminSchema>;

export const instituteSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2, "Institute name must be at least 2 characters"),
    code: z.string().min(2, "Code must be at least 2 characters"),
    domain: z.string().url("Invalid domain URL").or(z.string().min(3)),
    contactEmail: z.string().email("Invalid contact email"),
    status: instituteStatusSchema,
    admins: z.array(instituteAdminSchema).min(1, "At least one admin is required"),
    setupProgress: z.number().min(0).max(100),
    createdAt: z.string().optional(),
});

export type Institute = z.infer<typeof instituteSchema>;

export interface ActivityLog {
    id: string;
    action: string;
    user: string;
    timestamp: string;
    details?: string;
}

export interface SetupStep {
    id: string;
    title: string;
    description: string;
    status: "completed" | "in-progress" | "pending";
}
