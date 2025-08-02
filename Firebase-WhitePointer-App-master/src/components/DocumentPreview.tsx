import React, { useState, useEffect } from 'react';
import { DatabaseService } from '@/lib/database';

type DocumentPreviewProps = {
  documentId: string;
  caseId: string;
  onClose?: () => void;
};

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  documentId,
  caseId,
  onClose
}) => {
  const [document, setDocument] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        
        // Get document metadata
        const doc = await DatabaseService.getDocumentById(documentId);
        if (!doc) {
          throw new Error('Document not found');
        }
        
        setDocument(doc);
        
        // In a real app, we would decrypt the PDF here
        // For demo, we'll just show a placeholder
        setPdfUrl(`/api/documents/${caseId}/${documentId}`);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [documentId, caseId]);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={onClose}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <div>
          <h3 className="font-medium text-gray-900">{document?.fileName}</h3>
          <p className="text-sm text-gray-500">
            Signed by {document?.signedBy} on {new Date(document?.signedAt).toLocaleString()}
          </p>
        </div>
        
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Close preview"
          >
            ✕
          </button>
        )}
      </div>
      
      <div className="h-96 overflow-auto">
        {pdfUrl ? (
          <iframe 
            src={pdfUrl}
            className="w-full h-full border-0"
            title="Document Preview"
          />
        ) : (
          <div className="p-4 text-center text-gray-500">
            <p>Document preview not available</p>
          </div>
        )}
      </div>
      
      <div className="p-3 border-t bg-gray-50 flex justify-between text-sm">
        <span className="text-gray-500">
          {document?.fileSize ? `${(document.fileSize / 1024).toFixed(1)} KB` : ''}
        </span>
        <div className="flex gap-2">
          <a 
            href={pdfUrl || '#'} 
            download={document?.fileName}
            className="text-blue-600 hover:text-blue-800"
          >
            Download
          </a>
          <button className="text-gray-500 hover:text-gray-700">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};
