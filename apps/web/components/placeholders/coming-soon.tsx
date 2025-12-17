"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "motion/react"
import { ArrowLeft, Construction } from "lucide-react"
import Link from "next/link"

interface ComingSoonProps {
    title: string
    description: string
    features?: string[]
    moduleName: string
    backLink?: string
}

export function ComingSoon({
    title,
    description,
    features = [],
    moduleName,
    backLink = "/dashboard"
}: ComingSoonProps) {
    return (
        <div className="flex min-h-[80vh] flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-2xl"
            >
                <Card className="border-2 border-dashed border-muted-foreground/25 bg-muted/50">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                            <Construction className="h-10 w-10 text-primary animate-pulse" />
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight">{title}</CardTitle>
                        <CardDescription className="text-lg mt-2 font-medium text-primary">
                            {moduleName} Module Under Development
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 text-center">
                        <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
                            {description}
                        </p>

                        {features.length > 0 && (
                            <div className="bg-background/80 rounded-lg p-6 text-left border shadow-sm">
                                <h4 className="text-sm font-semibold mb-3">Planned Architecture Features:</h4>
                                <ul className="grid gap-2 sm:grid-cols-2">
                                    {features.map((feature, i) => (
                                        <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 + (i * 0.1) }}
                                            className="flex items-center text-sm text-muted-foreground"
                                        >
                                            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-primary" />
                                            {feature}
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="pt-4">
                            <Button asChild variant="secondary" className="gap-2">
                                <Link href={backLink}>
                                    <ArrowLeft className="h-4 w-4" />
                                    Return to Dashboard
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
