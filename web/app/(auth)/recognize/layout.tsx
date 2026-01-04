import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Recognition - Keystroke Authentication",
    description: "Identify users based on their typing pattern",
}

export default function RecognizeLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
