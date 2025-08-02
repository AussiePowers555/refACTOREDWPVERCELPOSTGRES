"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload,
  MoreVertical,
  FileText,
  FileImage,
  FileArchive,
  Folder,
  FolderOpen,
  ArrowLeft,
  Search,
  X,
  Download,
  Trash2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useCases } from "@/hooks/use-database";
import { useToast } from "@/hooks/use-toast";
import type { Document } from "@/lib/database-schema";
import type { CaseFrontend as Case } from "@/lib/database-schema";
import { format } from "date-fns";

interface CaseFolder {
  caseNumber: string;
  folderName: string;
  clientName: string;
  clientVehicleRego: string;
  documents: Document[];
  documentCount: number;
}

const getFileIcon = (type: string) => {
  switch (type) {
    case 'application/pdf':
      return <FileText className="h-6 w-6 text-destructive" />;
    case 'image/jpeg':
    case 'image/jpg':
    case 'image/png':
      return <FileImage className="h-6 w-6 text-primary" />;
    default:
      return <FileText className="h-6 w-6 text-muted-foreground" />;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useLocalStorage<Document[]>("documents", []);
  const { data: cases } = useCases();
  const { toast } = useToast();
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading documents...</div>;
  }

  // Generate case folders with proper naming format
  const caseFolders: CaseFolder[] = cases
    .map(caseItem => {
      const caseDocuments = documents.filter(doc => doc.case_number === caseItem.caseNumber);
      const folderName = `${caseItem.clientName}, ${caseItem.caseNumber} and ${caseItem.clientVehicleRego || 'No Rego'}`;
      
      return {
        caseNumber: caseItem.caseNumber,
        folderName,
        clientName: caseItem.clientName,
        clientVehicleRego: caseItem.clientVehicleRego || 'No Rego',
        documents: caseDocuments,
        documentCount: caseDocuments.length
      };
    })
    .filter(folder => folder.documentCount > 0); // Only show folders with documents

  // Current folder documents or filtered folders
  const currentFolderData = currentFolder ? caseFolders.find(f => f.caseNumber === currentFolder) : null;
  const currentDocuments = currentFolderData ? currentFolderData.documents : [];

  // Search functionality
  const filteredFolders = caseFolders.filter(folder =>
    searchQuery === '' ||
    folder.folderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    folder.caseNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDocuments = currentDocuments.filter(doc =>
    searchQuery === '' ||
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    toast({
      title: "Document Deleted",
      description: "Document has been successfully deleted.",
    });
  };

  const handleDownloadDocument = (doc: Document) => {
    // Create a download link
    const link = globalThis.document.createElement('a');
    link.href = doc.file_path;
    link.download = doc.filename;
    globalThis.document.body.appendChild(link);
    link.click();
    globalThis.document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: `Downloading ${doc.filename}`,
    });
  };

  const goToFolder = (caseNumber: string) => {
    setCurrentFolder(caseNumber);
    setSearchQuery('');
  };

  const goBack = () => {
    setCurrentFolder(null);
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentFolder && (
            <Button variant="outline" size="sm" onClick={goBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          )}
          <h1 className="text-2xl font-bold">
            {currentFolder ? `Case: ${currentFolderData?.folderName}` : 'Document Storage'}
          </h1>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" /> Upload Document
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={currentFolder ? "Search documents..." : "Search case folders..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {currentFolder ? 'Case Documents' : 'Case Folders'}
          </CardTitle>
          <CardDescription>
            {currentFolder
              ? `All documents for case ${currentFolderData?.caseNumber}. Files are synchronized with the case documents tab.`
              : 'Each case has its own folder containing all uploaded PDF and JPEG files. Folders are automatically created when documents are uploaded to a case.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!currentFolder ? (
            // Folder View
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFolders.map((folder) => (
                <Card
                  key={folder.caseNumber}
                  className="flex flex-col cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => goToFolder(folder.caseNumber)}
                >
                  <CardHeader className="flex-grow p-4">
                    <div className="flex items-start gap-3">
                      <Folder className="h-8 w-8 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">{folder.folderName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {folder.documentCount} file{folder.documentCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
              {filteredFolders.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No folders match your search.' : 'No case folders found. Upload documents to cases to create folders.'}
                </div>
              )}
            </div>
          ) : (
            // Document View
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="flex flex-col">
                  <CardHeader className="flex-grow p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {getFileIcon(doc.file_type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight truncate">{doc.filename}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatFileSize(doc.file_size)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(doc.uploaded_date), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                </Card>
              ))}
              {filteredDocuments.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No documents match your search.' : 'No documents found in this case folder.'}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
