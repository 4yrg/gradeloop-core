"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUserStore, UserRole } from "@/store/useUserStore"
import { Loader2 } from "lucide-react"

export default function RoleGuard({
    children,
    allowedRoles,
}: {
    children: React.ReactNode
    allowedRoles: UserRole[]
}) {
    const { user, isLoading } = useUserStore()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login")
        } else if (!isLoading && user && !allowedRoles.includes(user.currentRole)) {
            // Redirect to their allowed home
            if (user.currentRole === 'ADMIN') router.push('/admin')
            else if (user.currentRole === 'INSTRUCTOR') router.push('/instructor')
            else router.push('/student')
        }
    }, [user, isLoading, router, allowedRoles])

    if (isLoading || !user) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!allowedRoles.includes(user.currentRole)) {
        return null // Will redirect
    }

    return <>{children}</>
}
