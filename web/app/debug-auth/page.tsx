'use client';

import { useAuthStore } from '@/stores/auth.store';
import { useEffect, useState } from 'react';

export default function DebugPage() {
    const { user } = useAuthStore();
    const [cookies, setCookies] = useState<Record<string, string>>({});

    useEffect(() => {
        // Parse all cookies
        const cookieObj: Record<string, string> = {};
        document.cookie.split(';').forEach(cookie => {
            const [key, value] = cookie.trim().split('=');
            if (key) cookieObj[key] = value || '';
        });
        setCookies(cookieObj);
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h1>Debug Auth State</h1>

            <h2>Auth Store User:</h2>
            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
                {JSON.stringify(user, null, 2)}
            </pre>

            <h2>Cookies:</h2>
            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
                {JSON.stringify(cookies, null, 2)}
            </pre>

            <h2>Important Values:</h2>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                    <tr style={{ background: '#333', color: 'white' }}>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Key</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Value</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>user_email (cookie)</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{cookies.user_email || 'NOT SET'}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                            {cookies.user_email ? '✅' : '❌'}
                        </td>
                    </tr>
                    <tr>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>user_role (cookie)</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{cookies.user_role || 'NOT SET'}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                            {cookies.user_role ? '✅' : '❌'}
                        </td>
                    </tr>
                    <tr>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>user_id (cookie)</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{cookies.user_id || 'NOT SET'}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                            {cookies.user_id ? '✅' : '❌'}
                        </td>
                    </tr>
                    <tr style={{ background: '#fff3cd' }}>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}><strong>institute_id (cookie)</strong></td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}><strong>{cookies.institute_id || 'NOT SET'}</strong></td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                            <strong>{cookies.institute_id ? '✅' : '❌ MISSING'}</strong>
                        </td>
                    </tr>
                    <tr style={{ background: '#fff3cd' }}>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}><strong>user.instituteId (store)</strong></td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}><strong>{user?.instituteId || 'NOT SET'}</strong></td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                            <strong>{user?.instituteId ? '✅' : '❌ MISSING'}</strong>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div style={{ marginTop: '20px', padding: '15px', background: '#d1ecf1', borderRadius: '5px', border: '1px solid #bee5eb' }}>
                <h3 style={{ marginTop: 0 }}>📋 Instructions:</h3>
                <ol>
                    <li>If <code>institute_id</code> cookie is <strong>NOT SET</strong>, you need to <strong>logout and login again</strong></li>
                    <li>After login, refresh this page</li>
                    <li>Both cookie and store should show ✅</li>
                    <li>Then degree creation will work</li>
                </ol>
            </div>
        </div>
    );
}
