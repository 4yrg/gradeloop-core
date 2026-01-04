import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Enroll - Keystroke Authentication",
    description: "Train the system to recognize your typing pattern",
}

export default function EnrollLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
