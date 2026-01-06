// Stub for missing file

export interface Institute {
    id: string;
    name: string;
    status: 'active' | 'inactive' | 'pending';
    setupProgress: number;
}

export const useInstitutes = () => {
    return {
        data: [] as Institute[],
        isLoading: false,
        isError: false,
        error: null
    }
}
