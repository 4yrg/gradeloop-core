'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle } from 'lucide-react';
import { resetPassword } from '@/actions/auth';

const schema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [serverError, setServerError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
    });

    useEffect(() => {
        if (!token) {
            setServerError('Invalid or missing reset token');
        }
    }, [token]);

    const onSubmit = async (data: z.infer<typeof schema>) => {
        if (!token) {
            setServerError('Invalid or missing reset token');
            return;
        }

        setIsLoading(true);
        setServerError(null);
        setSuccessMessage(null);

        const formData = new FormData();
        formData.append('token', token);
        formData.append('password', data.password);
        formData.append('confirmPassword', data.confirmPassword);

        try {
            const result = await resetPassword({} as any, formData);

            if (result.success && result.message) {
                setSuccessMessage(result.message);
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    router.push('/auth/login');
                }, 2000);
            } else if (result.errors?._form) {
                setServerError(result.errors._form[0]);
            } else if (result.errors) {
                // Handle field-specific errors
                const firstError = Object.values(result.errors).flat()[0];
                if (firstError) {
                    setServerError(firstError);
                }
            }
        } catch (e) {
            setServerError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md space-y-8 rounded-lg border bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-950">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Reset Password
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Enter your new password
                    </p>
                </div>

                {successMessage ? (
                    <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/10">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800 dark:text-green-400">
                                    {successMessage}
                                </p>
                                <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                                    Redirecting to login...
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {serverError && (
                            <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/10 dark:text-red-400">
                                {serverError}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                New Password
                            </label>
                            <input
                                {...register('password')}
                                type="password"
                                className="mt-1 block w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:text-gray-100"
                                disabled={isLoading || !token}
                            />
                            {errors.password && (
                                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Confirm Password
                            </label>
                            <input
                                {...register('confirmPassword')}
                                type="password"
                                className="mt-1 block w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:text-gray-100"
                                disabled={isLoading || !token}
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !token}
                            className="flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reset Password
                        </button>

                        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                            Remember your password?{' '}
                            <Link
                                href="/auth/login"
                                className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                            >
                                Sign in
                            </Link>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
