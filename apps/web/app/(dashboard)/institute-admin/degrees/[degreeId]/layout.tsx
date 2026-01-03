"use client";

import { ReactNode } from "react";

interface DegreeDetailLayoutProps {
    children: ReactNode;
}

export default function DegreeDetailLayout({ children }: DegreeDetailLayoutProps) {
    // The previous implementation had a side panel.
    // We moved navigation to the global Sidebar to avoid nesting UIs.
    // This layout can now just be a clean wrapper or even removed if not needed.
    // We'll keep it simple to allow for future degree-specific context providers if needed.
    return (
        <div className="h-full">
            {children}
        </div>
    );
}
