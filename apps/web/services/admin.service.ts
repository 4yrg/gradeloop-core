
export interface DashboardSummary {
    totalUsers: {
        student: number;
        instructor: number;
        admin: number;
    };
    activeClasses: number;
    activeAssignments: number;
    systemUsage: {
        cpu: number;
        executions: number;
    };
    flaggedCases: number;
}

export interface AIGovernanceStats {
    aiGradingEnabledClasses: number;
    avgAiLikelihood: number;
    agentUsageRate: number; // percentage
}

export interface SystemAlert {
    id: string;
    type: 'warning' | 'error' | 'info';
    category: 'abuse' | 'resource' | 'integrity';
    message: string;
    timestamp: string;
}

const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
    totalUsers: {
        student: 1250,
        instructor: 45,
        admin: 3
    },
    activeClasses: 28,
    activeAssignments: 15,
    systemUsage: {
        cpu: 45, // percentage
        executions: 12500
    },
    flaggedCases: 12
};

const MOCK_AI_GOVERNANCE: AIGovernanceStats = {
    aiGradingEnabledClasses: 18,
    avgAiLikelihood: 12.5,
    agentUsageRate: 65
};

const MOCK_SYSTEM_ALERTS: SystemAlert[] = [
    {
        id: 'al1',
        type: 'warning',
        category: 'resource',
        message: 'Compute usage spike detected in Judge0 cluster',
        timestamp: new Date().toISOString()
    },
    {
        id: 'al2',
        type: 'error',
        category: 'integrity',
        message: 'Multiple high-similarity submissions detected in "Algorithms 101"',
        timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
        id: 'al3',
        type: 'info',
        category: 'abuse',
        message: 'Suspicious login attempts from IP 192.168.1.105',
        timestamp: new Date(Date.now() - 7200000).toISOString()
    }
];


export type AcademicNodeType = 'faculty' | 'degree' | 'year' | 'semester' | 'specialization' | 'batch' | 'class';

export interface AcademicNode {
    id: string;
    type: AcademicNodeType;
    name: string;
    children?: AcademicNode[];
    metadata?: Record<string, any>;
}

let MOCK_ACADEMIC_STRUCTURE: AcademicNode[] = [

    {
        id: 'fac-1', type: 'faculty', name: 'Faculty of Computing', children: [
            {
                id: 'deg-1', type: 'degree', name: 'B.Sc (Hons) IT', children: [
                    {
                        id: 'yr-1', type: 'year', name: '1st Year', children: [
                            {
                                id: 'sem-1', type: 'semester', name: '1st Semester', children: [
                                    {
                                        id: 'batch-1', type: 'batch', name: '2024 Regular', children: [
                                            { id: 'cls-1', type: 'class', name: 'Introduction to Programming (IT1010)' },
                                            { id: 'cls-2', type: 'class', name: 'Mathematics for Computing (IT1030)' }
                                        ]
                                    }
                                ]
                            },
                            {
                                id: 'sem-2', type: 'semester', name: '2nd Semester', children: [] // Term 2
                            }
                        ]
                    },
                    {
                        id: 'yr-2', type: 'year', name: '2nd Year', children: [
                            {
                                id: 'sem-3', type: 'semester', name: '1st Semester', children: [
                                    {
                                        id: 'spec-1', type: 'specialization', name: 'Software Engineering', children: [
                                            {
                                                id: 'batch-2', type: 'batch', name: 'SE Weekday', children: [
                                                    { id: 'cls-3', type: 'class', name: 'Object Oriented Programming (IT2010)' }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'fac-2', type: 'faculty', name: 'Faculty of Engineering', children: []
    }
];

// Helper to remove a node recursively
function removeNode(nodes: AcademicNode[], id: string): boolean {
    const customIndex = nodes.findIndex(n => n.id === id);
    if (customIndex !== -1) {
        nodes.splice(customIndex, 1);
        return true;
    }
    for (const node of nodes) {
        if (node.children && removeNode(node.children, id)) return true;
    }
    return false;
}

// Helper to find and update a node
function updateNodeInTree(nodes: AcademicNode[], id: string, updates: Partial<AcademicNode>): boolean {
    for (const node of nodes) {
        if (node.id === id) {
            Object.assign(node, updates);
            return true;
        }
        if (node.children && updateNodeInTree(node.children, id, updates)) return true;
    }
    return false;
}

// Helper to find and add child
function addChildToNode(nodes: AcademicNode[], parentId: string, newNode: AcademicNode): boolean {
    for (const node of nodes) {
        if (node.id === parentId) {
            if (!node.children) node.children = [];
            node.children.push(newNode);
            return true;
        }
        if (node.children && addChildToNode(node.children, parentId, newNode)) return true;
    }
    return false;
}


// Helper to flatten the tree and extract classes
function extractClasses(nodes: AcademicNode[]): ClassWithDetails[] {
    let classes: ClassWithDetails[] = [];

    function traverse(node: AcademicNode, path: string[]) {
        const currentPath = [...path, node.name];
        if (node.type === 'class') {
            classes.push({
                id: node.id,
                code: node.name.match(/\(([^)]+)\)/)?.[1] || "N/A", // Extract code from name (IT1010)
                name: node.name.split('(')[0].trim(),
                batch: path[path.length - 1] || "Unknown Batch", // Assumes parent is batch
                instructor: node.metadata?.instructor || "Unassigned",
                studentsCount: node.metadata?.studentsCount || Math.floor(Math.random() * 200) + 50,
                status: node.metadata?.status || 'active'
            });
        }
        if (node.children) {
            node.children.forEach(child => traverse(child, currentPath));
        }
    }

    nodes.forEach(node => traverse(node, []));
    return classes;
}

export interface ClassWithDetails {
    id: string;
    code: string;
    name: string;
    batch: string;
    instructor: string;
    studentsCount: number;
    status: 'active' | 'archived';
}


// Helper to extract all batches for dropdowns
function extractBatches(nodes: AcademicNode[]): { id: string, name: string, path: string }[] {
    let batches: { id: string, name: string, path: string }[] = [];

    function traverse(node: AcademicNode, path: string[]) {
        const currentPath = [...path, node.name];
        if (node.type === 'batch') {
            batches.push({
                id: node.id,
                name: node.name,
                path: currentPath.join(" > ")
            });
        }
        if (node.children) {
            node.children.forEach(child => traverse(child, currentPath));
        }
    }
    nodes.forEach(node => traverse(node, []));
    return batches;
}


// Mock Interfaces for Roles
export interface Permission {
    id: string;
    name: string;
    description: string;
    module: 'users' | 'classes' | 'assignments' | 'grading' | 'system';
}

export interface Role {
    id: string;
    name: string;
    description: string;
    permissions: string[]; // Permission IDs
    userCount: number;
}

const MOCK_PERMISSIONS: Permission[] = [
    { id: 'p1', name: 'view_users', description: 'View user list', module: 'users' },
    { id: 'p2', name: 'manage_users', description: 'Create and edit users', module: 'users' },
    { id: 'p3', name: 'view_classes', description: 'View classes', module: 'classes' },
    { id: 'p4', name: 'manage_classes', description: 'Create and edit classes', module: 'classes' },
    { id: 'p5', name: 'view_grades', description: 'View student grades', module: 'grading' },
    { id: 'p6', name: 'manage_system', description: 'Manage system settings', module: 'system' }
];

let MOCK_ROLES: Role[] = [
    { id: 'r1', name: 'Admin', description: 'Full system access', permissions: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'], userCount: 3 },
    { id: 'r2', name: 'Instructor', description: 'Class and assignment management', permissions: ['p1', 'p3', 'p4', 'p5'], userCount: 45 },
    { id: 'r3', name: 'Student', description: 'View own grades and classes', permissions: ['p3', 'p5'], userCount: 1250 },
    { id: 'r4', name: 'TA', description: 'Teaching Assistant', permissions: ['p1', 'p3', 'p5'], userCount: 12 }
];

export const AdminService = {
    getDashboardSummary: async (): Promise<DashboardSummary> => {
        await new Promise(resolve => setTimeout(resolve, 800));
        return MOCK_DASHBOARD_SUMMARY;
    },

    getAIGovernanceStats: async (): Promise<AIGovernanceStats> => {
        await new Promise(resolve => setTimeout(resolve, 600));
        return MOCK_AI_GOVERNANCE;
    },

    getSystemAlerts: async (): Promise<SystemAlert[]> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_SYSTEM_ALERTS;
    },

    getAcademicStructure: async (): Promise<AcademicNode[]> => {
        await new Promise(resolve => setTimeout(resolve, 800));
        return MOCK_ACADEMIC_STRUCTURE;
    },

    addNode: async (parentId: string | null, node: Omit<AcademicNode, "id" | "children">): Promise<AcademicNode> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const newNode: AcademicNode = { ...node, id: Math.random().toString(36).substr(2, 9), children: [] };

        if (!parentId) {
            MOCK_ACADEMIC_STRUCTURE.push(newNode);
        } else {
            addChildToNode(MOCK_ACADEMIC_STRUCTURE, parentId, newNode);
        }
        return newNode;
    },

    updateNode: async (nodeId: string, updates: Partial<AcademicNode>): Promise<AcademicNode> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        updateNodeInTree(MOCK_ACADEMIC_STRUCTURE, nodeId, updates);
        return { id: nodeId, ...updates } as AcademicNode; // Return mock
    },

    deleteNode: async (nodeId: string): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        removeNode(MOCK_ACADEMIC_STRUCTURE, nodeId);
    },

    // Class Management (Derived from Structure + Extra metadata in real app)
    getAllClasses: async (): Promise<ClassWithDetails[]> => {
        await new Promise(resolve => setTimeout(resolve, 600));
        // In a real app, this would be a direct DB query joining users tables
        return extractClasses(MOCK_ACADEMIC_STRUCTURE);
    },

    getAllBatches: async (): Promise<{ id: string, name: string, path: string }[]> => {
        await new Promise(resolve => setTimeout(resolve, 400));
        return extractBatches(MOCK_ACADEMIC_STRUCTURE);
    },

    updateClassDetails: async (classId: string, details: Partial<ClassWithDetails>): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        // We need to find the node and update its metadata
        const updates: Partial<AcademicNode> = {
            metadata: {
                instructor: details.instructor,
                status: details.status,
                studentsCount: details.studentsCount
            }
        };
        // Also update name if provided (reconstruct with code if needed, but simple update for now)
        if (details.name) {
            // complicated to update name preserving code logic without more data, skipping for mock simplicity or assuming name is just name
        }

        updateNodeInTree(MOCK_ACADEMIC_STRUCTURE, classId, updates);
    },

    // Bulk Operations
    bulkCreateClasses: async (csvData: any[]): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Mock processing: expect data like [{ batchId, code, name, instructor? }]
        csvData.forEach(row => {
            const newNode: AcademicNode = {
                id: Math.random().toString(36).substr(2, 9),
                type: 'class',
                name: `${row.name} (${row.code})`,
                metadata: {
                    instructor: row.instructor || "Unassigned",
                    status: 'active',
                    studentsCount: 0
                },
                children: []
            };
            // Simplistic: assumes batchId is valid or we just skip
            if (row.batchId) {
                addChildToNode(MOCK_ACADEMIC_STRUCTURE, row.batchId, newNode);
            }
        });
    },

    bulkCreateStudents: async (csvData: any[]): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Mock: just log or increment stats
        console.log(`Mock: Created ${csvData.length} students`);
    },

    // Role Management
    getAllRoles: async (): Promise<Role[]> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_ROLES;
    },

    getAllPermissions: async (): Promise<Permission[]> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_PERMISSIONS;
    },

    createRole: async (role: Omit<Role, "id" | 'userCount'>): Promise<Role> => {
        await new Promise(resolve => setTimeout(resolve, 600));
        const newRole = { ...role, id: Math.random().toString(36).substr(2, 9), userCount: 0 };
        MOCK_ROLES.push(newRole);
        return newRole;
    },

    updateRolePermissions: async (roleId: string, permissionIds: string[]): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const role = MOCK_ROLES.find(r => r.id === roleId);
        if (role) {
            role.permissions = permissionIds;
        }
    }
};
