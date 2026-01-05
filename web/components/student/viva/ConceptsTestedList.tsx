
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";

interface Concept {
    id: string;
    label: string;
    description: string;
    importance: 'high' | 'medium' | 'low';
}

interface ConceptsTestedListProps {
    concepts: Concept[];
}

export function ConceptsTestedList({ concepts }: ConceptsTestedListProps) {
    const getImportanceColor = (importance: string) => {
        switch (importance) {
            case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-medium">Concepts Tested</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {concepts.map((concept) => (
                    <div key={concept.id} className="flex flex-col space-y-1 pb-3 border-b last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{concept.label}</span>
                            <Badge variant="outline" className={`text-[10px] uppercase ${getImportanceColor(concept.importance)}`}>
                                {concept.importance} priority
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{concept.description}</p>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
