import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRosterStore } from "@/store/use-roster-store";

export function RosterSearch() {
    const { searchQuery, setSearchQuery } = useRosterStore();

    return (
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search by name or email..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
    );
}
