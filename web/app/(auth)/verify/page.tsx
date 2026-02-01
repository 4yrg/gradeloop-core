"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import Link from "next/link"
import { verifyMagicLink, verifyEmail } from "../../../actions/auth"

function VerifyContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get("token")
    const type = searchParams.get("type") // 'login' or 'confirm' or undefined (assume login)

    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")
    const [message, setMessage] = useState("Verifying your link...")

    useEffect(() => {
        if (!token) {
            setStatus("error")
            setMessage("Invalid link: Missing token.")
            return
        }

        const verify = async () => {
            console.log("Verifying token...", type);
            try {
                let result;
                if (type === "confirm") {
                    result = await verifyEmail(token);
                } else {
                    // Default to login / magic link
                    result = await verifyMagicLink(token);
                }

                if (result.success) {
                    setStatus("success")
                    setMessage("Verification successful! Redirecting...")

                    // Delay redirect slightly for UX
                    setTimeout(() => {
                        // Determine redirect based on role or default
                        // The action verified and set session, so we can just go to dashboard or intended destination.
                        // We could improve this by returning redirectUrl from action.
                        // For now default to dashboard
                        const redirect = result.user?.role === 'system-admin' ? '/system-admin' : '/dashboard';
                        router.push(redirect)
                    }, 1500)
                } else {
                    setStatus("error")
                    setMessage(result.error || "Verification failed. The link may be invalid or expired.")
                }
            } catch (err) {
                console.error("Verification error:", err)
                setStatus("error")
                setMessage("An unexpected error occurred.")
            }
        }

        verify()
    }, [token, type, router])

    return (
        <Card className="mx-auto max-w-sm w-full">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">
                    {status === "verifying" && "Verifying..."}
                    {status === "success" && "Success!"}
                    {status === "error" && "Error"}
                </CardTitle>
                <CardDescription>
                    {status === "verifying" && "Please wait while we verify your link."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
                {status === "verifying" && (
                    <div className="flex justify-center py-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                        <p className="text-sm text-green-700">{message}</p>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <XCircle className="h-12 w-12 text-red-500" />
                        <p className="text-sm text-red-600 font-medium">{message}</p>
                        <Button asChild variant="outline" className="mt-4">
                            <Link href="/login">Back to Login</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <Card className="mx-auto max-w-sm w-full">
                <CardContent className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                </CardContent>
            </Card>
        }>
            <VerifyContent />
        </Suspense>
    )
}
