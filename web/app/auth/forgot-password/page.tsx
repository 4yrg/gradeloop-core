'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import Link from 'next/link';
import { Loader2, CheckCircle } from 'lucide-react';
import { forgotPassword } from '@/actions/auth';

const schema = z.object({
    email: z.string().email('Please enter a valid email'),
});

export default function ForgotPasswordPage() {
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

    const onSubmit = async (data: z.infer<typeof schema>) => {
        setIsLoading(true);
        setServerError(null);
        setSuccessMessage(null);

        const formData = new FormData();
        formData.append('email', data.email);

        try {
            const result = await forgotPassword({} as any, formData);

            if (result.success && result.message) {
                setSuccessMessage(result.message);
            } else if (result.errors?._form) {
                setServerError(result.errors._form[0]);
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
                        Forgot Password
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Enter your email and we&apos;ll send you a reset link
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
                            </div>
                        </div>
                        <div className="mt-4">
                            <Link
                                href="/auth/login"
                                className="inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                            >
                                ← Back to login
                            </Link>
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
                                Email
                            </label>
                            <input
                                {...register('email')}
                                type="email"
                                className="mt-1 block w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:text-gray-100"
                                disabled={isLoading}
                                placeholder="your@email.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Reset Link
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
