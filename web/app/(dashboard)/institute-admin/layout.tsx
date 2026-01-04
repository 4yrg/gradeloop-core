export default function InstituteAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-8">
            {/* Breadcrumbs or shared headers could go here if not provided by parent dashboard layout */}
            {children}
        </div>
    );
}
