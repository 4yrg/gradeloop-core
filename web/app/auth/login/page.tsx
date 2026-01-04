'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { login } from '@/actions/auth';

const schema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: z.infer<typeof schema>) => {
        setIsLoading(true);
        setServerError(null);

        try {
            const result = await login(data);

            if (result.errors) {
                if ('_form' in result.errors && result.errors._form) {
                    setServerError(result.errors._form[0]);
                } else {
                    const firstError = Object.values(result.errors).flat()[0];
                    setServerError(firstError || 'Login failed');
                }
                setIsLoading(false);
            } else if (result.success) {
                // Use the redirectTo path from the server action based on user role
                const redirectPath = result.redirectTo || '/dashboard';
                router.refresh();
                router.push(redirectPath);
            }
        } catch (e) {
            setServerError("An error occurred during login.");
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md space-y-8 rounded-lg border bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-950">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Welcome back
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Sign in to your account
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {serverError && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/10 dark:text-red-400">
                            {serverError}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email
                        </label>
                        <input
                            {...register('email')}
                            type="email"
                            className="mt-1 block w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:text-gray-100"
                            disabled={isLoading}
                        />
                        {errors.email && (
                            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password
                        </label>
                        <input
                            {...register('password')}
                            type="password"
                            className="mt-1 block w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:text-gray-100"
                            disabled={isLoading}
                        />
                        {errors.password && (
                            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <Link
                            href="/auth/forgot-password"
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign in
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                    Don&apos;t have an account?{' '}
                    <Link
                        href="/auth/register"
                        className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                    >
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}
