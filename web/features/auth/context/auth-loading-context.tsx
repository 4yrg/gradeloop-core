"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface AuthLoadingContextType {
    isLoading: boolean
    setIsLoading: (loading: boolean) => void
}

const AuthLoadingContext = createContext<AuthLoadingContextType | undefined>(undefined)

export function AuthLoadingProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(false)

    return (
        <AuthLoadingContext.Provider value={{ isLoading, setIsLoading }}>
            {children}
        </AuthLoadingContext.Provider>
    )
}

export function useAuthLoading() {
    const context = useContext(AuthLoadingContext)
    if (context === undefined) {
        throw new Error("useAuthLoading must be used within AuthLoadingProvider")
    }
    return context
}
