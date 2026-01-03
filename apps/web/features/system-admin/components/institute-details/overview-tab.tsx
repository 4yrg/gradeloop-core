import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Institute } from "../../types"

interface OverviewTabProps {
    institute: Institute
}

export function OverviewTab({ institute }: OverviewTabProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <Badge
                        variant={
                            institute.status === "active"
                                ? "success"
                                : institute.status === "inactive"
                                    ? "destructive"
                                    : "warning"
                        }
                        className="capitalize"
                    >
                        {institute.status}
                    </Badge>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Institute Code</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{institute.code}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Domain</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{institute.domain}</div>
                </CardContent>
            </Card>
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Contact Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                    <div className="font-semibold">{institute.name}</div>
                    <div className="text-muted-foreground">{institute.contactEmail}</div>
                </CardContent>
            </Card>
        </div>
    )
}
