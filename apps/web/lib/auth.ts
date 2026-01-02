
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { z } from "zod"
import axios from "axios"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                try {
                    const { email, password } = await z
                        .object({ email: z.string().email(), password: z.string().min(1) })
                        .parseAsync(credentials)

                    // Call Go Auth Service
                    // In Docker, this would be http://auth-service:8080/api/auth/login
                    // From client browser, it goes through Traefik: /api/auth/login
                    // Server-side calls from NextAuth run in the container/server

                    const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://auth-service:8080/api/auth"

                    const res = await axios.post(`${authServiceUrl}/login`, {
                        email,
                        password,
                    })

                    const user = res.data.user
                    const token = res.data.token

                    if (user && token) {
                        // Return user object extended with token if needed, or just user
                        // We need to persist the token to session
                        return { ...user, accessToken: token }
                    }

                    return null
                } catch (error) {
                    console.error("Auth error:", error)
                    return null
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = (user as any).role
                token.instituteId = (user as any).institute_id
                token.accessToken = (user as any).accessToken
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string
                session.user.role = token.role as string
                session.user.instituteId = token.instituteId as string
            }
            return session
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: { strategy: "jwt" },
})
