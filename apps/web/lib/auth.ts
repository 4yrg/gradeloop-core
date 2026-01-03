
import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { z } from "zod"
import axios from "axios"

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    const { email, password } = await z
                        .object({ email: z.string().email(), password: z.string().min(1) })
                        .parseAsync(credentials)

                    // Call Go Auth Service
                    const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://auth-service:8080/api/auth"

                    const res = await axios.post(`${authServiceUrl}/login`, {
                        email,
                        password,
                    })

                    const user = res.data.user
                    const token = res.data.token

                    if (user && token) {
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
            if (token && session.user) {
                const user = session.user as any
                user.id = token.id
                user.role = token.role
                user.instituteId = token.instituteId
            }
            return session
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
    },
}

export default NextAuth(authOptions)
