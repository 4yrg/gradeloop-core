import { Institute, ActivityLog, SetupStep } from "../types";

export const MOCK_INSTITUTES: Institute[] = [
    {
        id: "1",
        name: "Global Tech Institute",
        code: "GTI001",
        domain: "gti.edu",
        contactEmail: "admin@gti.edu",
        status: "active",
        setupProgress: 100,
        createdAt: "2023-10-01T10:00:00Z",
        admins: [
            { id: "a1", name: "John Doe", email: "john@gti.edu", role: "owner" },
            { id: "a2", name: "Jane Smith", email: "jane@gti.edu", role: "admin" },
        ],
    },
    {
        id: "2",
        name: "Future Learning Academy",
        code: "FLA002",
        domain: "fla.edu",
        contactEmail: "contact@fla.edu",
        status: "pending",
        setupProgress: 65,
        createdAt: "2023-11-15T09:30:00Z",
        admins: [
            { id: "a3", name: "Robert Brown", email: "robert@fla.edu", role: "owner" },
        ],
    },
    {
        id: "3",
        name: "Innovation Hub",
        code: "IH003",
        domain: "ihub.io",
        contactEmail: "info@ihub.io",
        status: "inactive",
        setupProgress: 20,
        createdAt: "2023-12-05T14:20:00Z",
        admins: [
            { id: "a4", name: "Alice Green", email: "alice@ihub.io", role: "owner" },
        ],
    },
];

export const MOCK_ACTIVITY_LOGS: ActivityLog[] = [
    {
        id: "l1",
        action: "Member Invited",
        user: "System Admin",
        timestamp: "2023-12-20T10:00:00Z",
        details: "Invited Sarah Wilson as admin",
    },
    {
        id: "l2",
        action: "Status Changed",
        user: "System Admin",
        timestamp: "2023-12-19T15:30:00Z",
        details: "Changed status from Pending to Active",
    },
];

export const MOCK_SETUP_STEPS: SetupStep[] = [
    {
        id: "s1",
        title: "Domain Verification",
        description: "Verify the institute domain ownership",
        status: "completed",
    },
    {
        id: "s2",
        title: "Primary Admin Setup",
        description: "Initialize the first owner account",
        status: "completed",
    },
    {
        id: "s3",
        title: "Brand Configuration",
        description: "Upload logo and set theme colors",
        status: "in-progress",
    },
    {
        id: "s4",
        title: "LMS Integrations",
        description: "Connect external code repositories",
        status: "pending",
    },
];
