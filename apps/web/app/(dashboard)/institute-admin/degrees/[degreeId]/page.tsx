"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function DegreeDetailPage() {
    const router = useRouter();
    const params = useParams();
    const degreeId = params.degreeId as string;

    useEffect(() => {
        if (degreeId) {
            router.push(`/institute-admin/degrees/${degreeId}/classes`);
        }
    }, [degreeId, router]);

    return null;
}
