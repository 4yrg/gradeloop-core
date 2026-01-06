'use client';

import { useAuthStore } from '@/stores/auth.store';

export function DebugAuthStore() {
    const { user } = useAuthStore();

    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            background: '#000',
            color: '#0f0',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 9999,
            maxWidth: '300px',
            wordBreak: 'break-all'
        }}>
            <div><strong>Auth Store Debug:</strong></div>
            <div>Email: {user?.email || 'null'}</div>
            <div>Role: {user?.role || 'null'}</div>
            <div>InstituteId: {user?.instituteId || 'UNDEFINED'}</div>
            <div>User ID: {user?.id || 'null'}</div>
        </div>
    );
}
