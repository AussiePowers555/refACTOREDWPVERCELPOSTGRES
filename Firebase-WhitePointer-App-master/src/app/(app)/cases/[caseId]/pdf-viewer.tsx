
"use client";

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import type { Document } from '@/lib/database-schema';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, Download } from "lucide-react";
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PdfViewer({ caseNumber }: { caseNumber: string }) {
    const { toast } = useToast();
    const [documents, setDocuments] = useLocalStorage<Document[]>("documents", []);
    const [selectedPdf, setSelectedPdf] = useState<Document | null>(null);

    const pdfDocuments = documents.filter(doc => doc.case_number === caseNumber && doc.file_type === 'application/pdf');

    const handleDelete = (docId: string) => {
        if (selectedPdf?.id === docId) {
            setSelectedPdf(null);
        }
        setDocuments(prev => prev.filter(doc => doc.id !== docId));
        toast({
            variant: "destructive",
            title: "PDF Deleted",
            description: "The PDF has been permanently deleted.",
        });
    };

    const handleDownload = (doc: Document) => {
        const link = document.createElement('a');
        link.href = doc.file_path;
        link.download = doc.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>PDF Documents</CardTitle>
                <CardDescription>All PDF files related to case {caseNumber}. Select a file to view it.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* PDF List */}
                    <div className="md:col-span-1">
                        <h3 className="text-lg font-semibold mb-2">Available PDFs</h3>
                         <ScrollArea className="h-96 rounded-md border">
                            <div className="p-2 space-y-2">
                            {pdfDocuments.length > 0 ? (
                                pdfDocuments.map(doc => (
                                    <div 
                                        key={doc.id} 
                                        className={`p-3 rounded-md border cursor-pointer hover:bg-muted/50 ${selectedPdf?.id === doc.id ? 'bg-muted' : ''}`}
                                        onClick={() => setSelectedPdf(doc)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-6 w-6 text-destructive flex-shrink-0" />
                                            <div className="flex-grow overflow-hidden">
                                                <p className="font-medium truncate">{doc.filename}</p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(doc.uploaded_date), "PPP")}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-4 text-sm text-muted-foreground">No PDFs found.</div>
                            )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* PDF Viewer */}
                    <div className="md:col-span-2">
                         <h3 className="text-lg font-semibold mb-2">Preview</h3>
                        <div className="aspect-[4/5] rounded-lg border bg-secondary flex items-center justify-center">
                            {selectedPdf ? (
                                <div className="w-full h-full flex flex-col">
                                    <div className="flex justify-between items-center p-2 bg-muted/50 border-b">
                                        <p className="text-sm font-medium truncate">{selectedPdf.filename}</p>
                                        <div className="flex gap-1">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                     <Button variant="destructive" size="icon" className="h-7 w-7">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action will permanently delete the PDF.</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(selectedPdf.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                            <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => handleDownload(selectedPdf)}>
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <iframe
                                        src={selectedPdf.file_path}
                                        className="w-full flex-grow border-0"
                                        title={selectedPdf.filename}
                                    />
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Select a PDF to preview</p>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
