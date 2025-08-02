
"use client";

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import type { Document } from '@/lib/database-schema';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Trash2, Download, Maximize, X } from "lucide-react";
import Image from 'next/image';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function ImageGallery({ caseNumber }: { caseNumber: string }) {
    const { toast } = useToast();
    const [documents, setDocuments] = useLocalStorage<Document[]>("documents", []);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const imageDocuments = documents.filter(doc => doc.case_number === caseNumber && doc.file_type?.startsWith('image/'));

    const handleDelete = (docId: string) => {
        setDocuments(prev => prev.filter(doc => doc.id !== docId));
        toast({
            variant: "destructive",
            title: "Image Deleted",
            description: "The image has been permanently deleted.",
        });
    };

    const handleDownload = (doc: Document) => {
        const link = document.createElement('a');
        link.href = doc.file_path || '';
        link.download = doc.filename || '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Image Gallery</CardTitle>
                <CardDescription>All images related to case {caseNumber}. Click an image to view it larger.</CardDescription>
            </CardHeader>
            <CardContent>
                {imageDocuments.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {imageDocuments.map((doc) => (
                            <div key={doc.id} className="group relative aspect-square rounded-lg overflow-hidden border">
                                <Image
                                    src={doc.file_path || ''}
                                    alt={doc.filename || ''}
                                    layout="fill"
                                    objectFit="cover"
                                    className="cursor-pointer transition-transform duration-300 group-hover:scale-105"
                                    onClick={() => setSelectedImage(doc.file_path || '')}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-2">
                                     <div className='flex justify-end gap-1'>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="icon" className="h-7 w-7">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>This action cannot be undone. This will permanently delete the image.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(doc.id)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                         <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => handleDownload(doc)}>
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="text-white text-xs truncate">
                                        <p className="font-semibold">{doc.filename}</p>
                                        <p>{format(new Date(doc.uploaded_date), "PPP")}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 rounded-lg border-2 border-dashed border-muted-foreground/20">
                        <p className="text-muted-foreground">No images uploaded for this case yet.</p>
                    </div>
                )}
                 <Dialog open={!!selectedImage} onOpenChange={(isOpen) => !isOpen && setSelectedImage(null)}>
                    <DialogContent className="max-w-4xl max-h-[90vh] flex items-center justify-center p-2">
                        {selectedImage && (
                            <Image
                                src={selectedImage}
                                alt="Enlarged view"
                                width={1200}
                                height={800}
                                className="w-auto h-auto max-w-full max-h-[85vh] object-contain"
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
