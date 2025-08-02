
"use client";

import { useState, useRef, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import type { Document } from '@/lib/database-schema';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileUp } from "lucide-react";

export default function DocumentUpload({ caseNumber }: { caseNumber: string }) {
    const { toast } = useToast();
    const [documents, setDocuments] = useLocalStorage<Document[]>("documents", []);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileSelect = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const newDocument: Document = {
                    id: `doc-${Date.now()}-${Math.random()}`,
                    filename: file.name,
                    file_type: file.type,
                    file_size: file.size,
                    case_number: caseNumber,
                    uploaded_date: new Date().toISOString(),
                    file_path: e.target?.result as string,
                };

                setDocuments(prev => [...prev, newDocument]);
                toast({
                    title: "Document Uploaded",
                    description: `Successfully uploaded ${file.name}.`,
                });
            };

            reader.readAsDataURL(file);
        });

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
                <CardDescription>Upload new documents for case {caseNumber}.</CardDescription>
            </CardHeader>
            <CardContent>
                <div
                    className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg transition-colors
                        ${isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/20'}`
                    }
                    onDragEnter={onDragEnter}
                    onDragLeave={onDragLeave}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                >
                    <FileUp className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">Drag & drop files here, or click to browse</p>
                    <Button onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" /> Browse Files
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                        multiple
                    />
                </div>
            </CardContent>
        </Card>
    );
}
