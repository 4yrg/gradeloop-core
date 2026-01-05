export const instituteKeys = {
    all: ["institutes"] as const,
    lists: () => [...instituteKeys.all, "list"] as const,
    list: (filters: any) => [...instituteKeys.lists(), { filters }] as const,
    details: () => [...instituteKeys.all, "detail"] as const,
    detail: (id: string) => [...instituteKeys.details(), id] as const,
    logs: (id: string) => [...instituteKeys.all, "logs", id] as const,
    setup: (id: string) => [...instituteKeys.all, "setup", id] as const,
};
