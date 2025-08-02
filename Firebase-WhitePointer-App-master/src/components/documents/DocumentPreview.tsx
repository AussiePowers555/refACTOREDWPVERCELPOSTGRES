"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Eye, Edit3, Send, X, ExternalLink } from 'lucide-react';
import JotFormRenderer from '@/components/forms/JotFormRenderer';
import type { CaseFrontend } from '@/lib/database-schema';

interface DocumentInfo {
  id: string;
  name: string;
  description: string;
  jotformId: string;
  type: 'claims' | 'not-at-fault-rental' | 'certis-rental' | 'authority-to-act' | 'direction-to-pay';
  status: 'pending' | 'sent' | 'signed' | 'completed';
}

interface DocumentPreviewProps {
  document: DocumentInfo;
  caseData: CaseFrontend;
  isOpen: boolean;
  onClose: () => void;
  onFormSubmit: (formData: Record<string, any>, method: 'email' | 'sms') => Promise<void>;
}

export default function DocumentPreview({ 
  document, 
  caseData, 
  isOpen, 
  onClose, 
  onFormSubmit 
}: DocumentPreviewProps) {
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'signed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleFormSubmit = async (formData: Record<string, any>, method: 'email' | 'sms') => {
    setIsSubmitting(true);
    try {
      await onFormSubmit(formData, method);
      onClose(); // Close modal after successful submission
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getJotFormUrl = (jotformId: string) => {
    return `https://form.jotform.com/${jotformId}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5" />
              <div>
                <DialogTitle>{document.name}</DialogTitle>
                <DialogDescription className="mt-1">
                  {document.description} • Case: {caseData.caseNumber}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(document.status)}>
                {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex items-center justify-between border-b pb-4 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Button
              variant={mode === 'preview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('preview')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Form
            </Button>
            <Button
              variant={mode === 'edit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('edit')}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit & Send
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(getJotFormUrl(document.jotformId), '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Original Form
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {mode === 'preview' ? (
              <PreviewMode 
                document={document} 
                caseData={caseData}
                onEditClick={() => setMode('edit')}
              />
            ) : (
              <EditMode 
                document={document} 
                caseData={caseData}
                onFormSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
              />
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PreviewModeProps {
  document: DocumentInfo;
  caseData: CaseFrontend;
  onEditClick: () => void;
}

function PreviewMode({ document, caseData, onEditClick }: PreviewModeProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Document Header */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">{document.name}</h3>
        <p className="text-muted-foreground mb-4">{document.description}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Case Number:</span>
            <p>{caseData.caseNumber}</p>
          </div>
          <div>
            <span className="font-medium">Client:</span>
            <p>{caseData.clientName}</p>
          </div>
          <div>
            <span className="font-medium">At-Fault Party:</span>
            <p>{caseData.atFaultPartyName}</p>
          </div>
          <div>
            <span className="font-medium">Status:</span>
            <p className="capitalize">{document.status}</p>
          </div>
        </div>
      </div>

      {/* Form Preview */}
      <div className="border rounded-lg">
        <div className="border-b p-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Form Preview</h4>
            <Button onClick={onEditClick} size="sm">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Form
            </Button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="bg-white border rounded min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h4 className="font-medium mb-2">JotForm Document Preview</h4>
              <p className="text-sm text-muted-foreground mb-4">
                This form will be pre-filled with case data and ready to send to the client.
              </p>
              <p className="text-xs text-muted-foreground">
                Form ID: {document.jotformId}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Case Data Summary */}
      <div className="bg-muted/30 rounded-lg p-4">
        <h4 className="font-medium mb-3">Case Data to be Pre-filled</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-muted-foreground">Client Details</span>
            <div className="mt-1 space-y-1">
              <p>Name: {caseData.clientName}</p>
              <p>Phone: {caseData.clientPhone || 'Not provided'}</p>
              <p>Email: {caseData.clientEmail || 'Not provided'}</p>
              <p>Insurance: {caseData.clientInsuranceCompany || 'Not provided'}</p>
            </div>
          </div>
          
          <div>
            <span className="font-medium text-muted-foreground">At-Fault Party</span>
            <div className="mt-1 space-y-1">
              <p>Name: {caseData.atFaultPartyName}</p>
              <p>Phone: {caseData.atFaultPartyPhone || 'Not provided'}</p>
              <p>Email: {caseData.atFaultPartyEmail || 'Not provided'}</p>
              <p>Insurance: {caseData.atFaultPartyInsuranceCompany || 'Not provided'}</p>
            </div>
          </div>
          
          <div>
            <span className="font-medium text-muted-foreground">Case Information</span>
            <div className="mt-1 space-y-1">
              <p>Date: {caseData.accidentDate || 'Not provided'}</p>
              <p>Time: {caseData.accidentTime || 'Not provided'}</p>
              <p>At Fault Party: {caseData.atFaultPartyName || 'Not provided'}</p>
              <p>Client Phone: {caseData.clientPhone || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EditModeProps {
  document: DocumentInfo;
  caseData: CaseFrontend;
  onFormSubmit: (formData: Record<string, any>, method: 'email' | 'sms') => Promise<void>;
  isSubmitting: boolean;
}

function EditMode({ document, caseData, onFormSubmit, isSubmitting }: EditModeProps) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <Send className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Edit & Send Document</h3>
        </div>
        <p className="text-muted-foreground">
          Review the pre-filled form data below, make any necessary changes, save as draft, and send to the client.
        </p>
        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> Use "Save Draft" to preserve your changes, then "Send Prefilled Form" to deliver the completed form to your client via email or SMS.
          </p>
        </div>
      </div>
      
      <JotFormRenderer
        documentType={document.type}
        caseData={caseData}
        onFormSubmit={onFormSubmit}
      />
    </div>
  );
}

// Export document configurations
export const DOCUMENT_TYPES: DocumentInfo[] = [
  {
    id: 'claims-form',
    name: 'Claims Form',
    description: 'Initial claim documentation and details',
    jotformId: '232543267390861',
    type: 'claims',
    status: 'pending'
  },
  {
    id: 'not-at-fault-rental',
    name: 'Not At Fault Rental Agreement',
    description: 'Rental agreement for not-at-fault party claims',
    jotformId: '233241680987464',
    type: 'not-at-fault-rental',
    status: 'pending'
  },
  {
    id: 'certis-rental',
    name: 'Certis Rental Agreement',
    description: 'Specialized rental agreement through Certis',
    jotformId: '233238940095055',
    type: 'certis-rental',
    status: 'pending'
  },
  {
    id: 'authority-to-act',
    name: 'Authority to Act',
    description: 'Legal authorization document for representation',
    jotformId: '233183619631457',
    type: 'authority-to-act',
    status: 'pending'
  },
  {
    id: 'direction-to-pay',
    name: 'Direction to Pay',
    description: 'Payment direction and authorization form',
    jotformId: '233061493503046',
    type: 'direction-to-pay',
    status: 'pending'
  }
];