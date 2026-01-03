
export default function AssignmentManageLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col h-full bg-background">
            {children}
        </div>
    )
}
