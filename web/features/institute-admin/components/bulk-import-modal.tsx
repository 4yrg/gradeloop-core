"use client";

import { useState, useRef } from "react";
import { Upload, FileUp, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../../components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../../components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";

interface BulkImportModalProps<T> {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (data: T[]) => Promise<void>;
    entityName: string;
    templateHeaders: string[]; // e.g., ["firstName", "lastName", "email"]
    mapRow: (row: string[]) => T | null; // Function to map CSV row to object
}

export function BulkImportModal<T>({
    open,
    onOpenChange,
    onImport,
    entityName,
    templateHeaders,
    mapRow,
}: BulkImportModalProps<T>) {
    const [step, setStep] = useState<"upload" | "preview">("upload");
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<T[]>([]);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const reset = () => {
        setStep("upload");
        setFile(null);
        setParsedData([]);
        setError(null);
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) reset();
        onOpenChange(newOpen);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
                setError("Please upload a valid CSV file.");
                return;
            }
            setFile(selectedFile);
            setError(null);
            parseCSV(selectedFile);
        }
    };

    const parseCSV = (file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split(/\r\n|\n/).filter((line) => line.trim() !== "");

            // Simple validation: check header count
            // In a real app, strict header checking would go here

            const dataRows = lines.slice(1); // Skip header
            const parsed: T[] = [];

            dataRows.forEach((row) => {
                const cols = row.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
                if (cols.length >= templateHeaders.length) {
                    const mapped = mapRow(cols);
                    if (mapped) parsed.push(mapped);
                }
            });

            if (parsed.length === 0) {
                setError("No valid data found in CSV.");
                return;
            }

            setParsedData(parsed);
            setStep("preview");
        };
        reader.onerror = () => setError("Failed to read file.");
        reader.readAsText(file);
    };

    const handleImport = async () => {
        try {
            setImporting(true);
            await onImport(parsedData);
            handleOpenChange(false);
        } catch (err) {
            setError("Import failed. Please try again.");
        } finally {
            setImporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Bulk Import {entityName}</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file to add multiple {entityName.toLowerCase()}s at once.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {step === "upload" && (
                    <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed p-10 text-center">
                        <div className="rounded-full bg-muted p-4">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">
                                Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">CSV files only</p>
                        </div>
                        <Input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Select CSV
                        </Button>
                        <div className="mt-4 text-xs text-muted-foreground">
                            <p>Expected format: {templateHeaders.join(", ")}</p>
                        </div>
                    </div>
                )}

                {step === "preview" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Found <strong>{parsedData.length}</strong> valid rows.
                            </p>
                            <Button variant="ghost" size="sm" onClick={reset}>
                                Choose different file
                            </Button>
                        </div>
                        <div className="max-h-[300px] overflow-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {templateHeaders.map((h) => (
                                            <TableHead key={h}>{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedData.slice(0, 5).map((row: any, i) => (
                                        <TableRow key={i}>
                                            {Object.values(row).slice(0, templateHeaders.length).map((val: any, j) => (
                                                <TableCell key={j}>{String(val)}</TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {parsedData.length > 5 && (
                            <p className="text-xs text-center text-muted-foreground">
                                ...and {parsedData.length - 5} more rows.
                            </p>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        Cancel
                    </Button>
                    {step === "preview" && (
                        <Button onClick={handleImport} disabled={importing}>
                            {importing ? "Importing..." : `Import ${parsedData.length} Items`}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
