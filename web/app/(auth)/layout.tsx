import Image from "next/image"
import { AuthLoadingProvider } from "../../features/auth/context/auth-loading-context"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthLoadingProvider>
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4">
                <div className="mb-8 flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                        <Image
                            src="/gradeloop_logo.png"
                            alt="Gradeloop Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <span className="font-red-hat-display text-3xl font-bold tracking-tight text-primary">
                        GradeLoop
                    </span>
                </div>
                {children}
            </div>
        </AuthLoadingProvider>
    )
}
