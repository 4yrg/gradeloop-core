'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { changePassword } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ForceResetPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<boolean>(false)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)
        
        const currentPassword = formData.get('currentPassword') as string
        const newPassword = formData.get('newPassword') as string
        const confirmPassword = formData.get('confirmPassword') as string

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match")
            setLoading(false)
            return
        }

        const result = await changePassword({ currentPassword, newPassword })

        if (result.errors) {
            setError(result.errors._form ? result.errors._form[0] : "Failed to change password")
            setLoading(false)
        } else {
            setSuccess(true)
            // Redirect after short delay or button click
            setTimeout(() => {
                router.push('/login') // Force re-login or dashboard?
                // Ideally dashboard, but session might need refresh. 
                // Since we didn't update session on server, re-login is safer.
                // Or we pushed '/login' and let middleware handle it.
            }, 2000)
        }
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>You must change your password to continue.</CardDescription>
                </CardHeader>
                <form action={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        {success && (
                            <Alert className="bg-green-50 text-green-900 border-green-200">
                                <AlertDescription>Password changed successfully. Redirecting...</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current (Temporary) Password</Label>
                            <Input id="currentPassword" name="currentPassword" type="password" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input id="newPassword" name="newPassword" type="password" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input id="confirmPassword" name="confirmPassword" type="password" required />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" type="submit" disabled={loading || success}>
                            {loading ? 'Changing...' : 'Change Password'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
