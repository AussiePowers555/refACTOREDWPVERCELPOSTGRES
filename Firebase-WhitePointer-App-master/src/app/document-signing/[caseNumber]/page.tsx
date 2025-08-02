'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText, Eye, Loader2, CheckCircle, Clock, Mail, Edit3, Check, X, Phone, Save } from 'lucide-react';
import Link from 'next/link';
import DocumentPreview, { DOCUMENT_TYPES } from '@/components/documents/DocumentPreview';
import type { CaseFrontend as Case } from '@/lib/database-schema';

interface DocumentStatus {
  [key: string]: 'pending' | 'sent' | 'signed' | 'completed';
}

export default function DocumentSigningPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const caseNumber = params.caseNumber as string;

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [documentStatuses, setDocumentStatuses] = useState<DocumentStatus>({});
  const [selectedDocument, setSelectedDocument] = useState<typeof DOCUMENT_TYPES[0] | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Editable fields state
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editEmailValue, setEditEmailValue] = useState('');
  const [editPhoneValue, setEditPhoneValue] = useState('');
  
  // Check for drafts function
  const checkForDraft = (documentType: string) => {
    try {
      const draftKey = `draft_${caseNumber}_${documentType}`;
      const savedDraft = localStorage.getItem(draftKey);
      return savedDraft ? JSON.parse(savedDraft) : null;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    const fetchCase = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/cases/by-number/${caseNumber}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            toast({
              variant: 'destructive',
              title: 'Case Not Found',
              description: `Case ${caseNumber} could not be found.`,
            });
            router.push('/cases');
            return;
          }
          throw new Error('Failed to fetch case');
        }
        
        const foundCase = await response.json();
        setCaseData(foundCase);
        setEditEmailValue(foundCase.clientEmail || '');
        setEditPhoneValue(foundCase.clientPhone || '');
        
        // Load document statuses from localStorage for this specific case
        const storedStatuses = localStorage.getItem(`document_statuses_${caseNumber}`);
        if (storedStatuses) {
          setDocumentStatuses(JSON.parse(storedStatuses));
        }
      } catch (error) {
        console.error('Error fetching case:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load case data. Please try again.',
        });
        router.push('/cases');
      } finally {
        setLoading(false);
      }
    };

    fetchCase();
  }, [caseNumber, router, toast]);

  // Handler functions for editable fields
  const updateCaseField = async (field: 'clientEmail' | 'clientPhone', value: string) => {
    if (!caseData) return;

    const updatedCase = { ...caseData, [field]: value };
    setCaseData(updatedCase);

    try {
      const response = await fetch(`/api/cases/by-number/${caseNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error('Failed to update case');
      }

      toast({
        title: 'Field Updated',
        description: `${field === 'clientEmail' ? 'Email' : 'Phone'} has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error updating case:', error);
      // Revert the local state if the API call failed
      setCaseData(caseData);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Failed to update case. Please try again.',
      });
    }
  };

  const handleEmailEdit = () => {
    setIsEditingEmail(true);
    setEditEmailValue(caseData?.clientEmail || '');
  };

  const handleEmailSave = () => {
    updateCaseField('clientEmail', editEmailValue);
    setIsEditingEmail(false);
  };

  const handleEmailCancel = () => {
    setEditEmailValue(caseData?.clientEmail || '');
    setIsEditingEmail(false);
  };

  const handlePhoneEdit = () => {
    setIsEditingPhone(true);
    setEditPhoneValue(caseData?.clientPhone || '');
  };

  const handlePhoneSave = () => {
    updateCaseField('clientPhone', editPhoneValue);
    setIsEditingPhone(false);
  };

  const handlePhoneCancel = () => {
    setEditPhoneValue(caseData?.clientPhone || '');
    setIsEditingPhone(false);
  };

  // Test communication functions
  const handleTestEmail = async () => {
    if (!caseData || !caseData.clientEmail) {
      toast({
        variant: 'destructive',
        title: 'No Email',
        description: 'Please add an email address first.',
      });
      return;
    }

    try {
      const response = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: caseData.clientEmail,
          clientName: caseData.clientName,
          caseNumber: caseData.caseNumber,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Test Email Sent',
          description: `Test email sent successfully to ${caseData.clientEmail}`,
        });
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        variant: 'destructive',
        title: 'Email Failed',
        description: error instanceof Error ? error.message : 'Failed to send test email.',
      });
    }
  };

  const handleTestSMS = async () => {
    if (!caseData || !caseData.clientPhone) {
      toast({
        variant: 'destructive',
        title: 'No Phone Number',
        description: 'Please add a phone number first.',
      });
      return;
    }

    try {
      const response = await fetch('/api/send-test-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: caseData.clientPhone,
          clientName: caseData.clientName,
          caseNumber: caseData.caseNumber,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Test SMS Sent',
          description: `Test SMS sent successfully to ${caseData.clientPhone}`,
        });
      } else {
        throw new Error(result.error || 'Failed to send SMS');
      }
    } catch (error) {
      console.error('Error sending test SMS:', error);
      toast({
        variant: 'destructive',
        title: 'SMS Failed',
        description: error instanceof Error ? error.message : 'Failed to send test SMS.',
      });
    }
  };

  const handleTestPrefilledEmail = async () => {
    if (!caseData || !caseData.clientEmail) {
      toast({
        variant: 'destructive',
        title: 'No Email',
        description: 'Please add an email address first.',
      });
      return;
    }

    try {
      const response = await fetch('/api/test-email-prefilled', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: caseData.clientEmail,
          caseNumber: caseData.caseNumber,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Test Prefilled Form Sent',
          description: `Test prefilled form email sent successfully to ${caseData.clientEmail}`,
        });
      } else {
        throw new Error(result.error || 'Failed to send prefilled form email');
      }
    } catch (error) {
      console.error('Error sending test prefilled email:', error);
      toast({
        variant: 'destructive',
        title: 'Prefilled Email Failed',
        description: error instanceof Error ? error.message : 'Failed to send test prefilled form email.',
      });
    }
  };

  const handleDocumentClick = (documentName: string) => {
    const documentType = DOCUMENT_TYPES.find(doc => doc.name === documentName);
    if (documentType && caseData) {
      // Get current status from documentStatuses
      const currentStatus = documentStatuses[documentType.type] || 'pending';
      setSelectedDocument({
        ...documentType,
        status: currentStatus
      });
      setPreviewOpen(true);
    }
  };

  const handleFormSubmit = async (formData: Record<string, any>, method: 'email' | 'sms') => {
    if (!caseData || !selectedDocument) return;

    try {
      // Use the contact information from formData if available (may have been edited inline)
      const clientEmail = formData.clientEmail || caseData.clientEmail;
      const clientPhone = formData.clientPhone || caseData.clientPhone;

      const response = await fetch('/api/documents/send-for-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentType: selectedDocument.type,
          formData,
          method,
          clientEmail,
          clientPhone,
          // Include all case data for proper form prefilling (includes caseNumber and clientName)
          ...caseData
        }),
      });

      const result = await response.json();

      if (result.success) {
        const newStatuses: DocumentStatus = {
          ...documentStatuses,
          [selectedDocument.type]: 'sent' as const
        };
        setDocumentStatuses(newStatuses);
        
        // Save document statuses to localStorage for persistence
        localStorage.setItem(`document_statuses_${caseNumber}`, JSON.stringify(newStatuses));

        toast({
          title: 'Document Sent',
          description: `${selectedDocument.name} has been sent via ${method} successfully.`,
        });
      } else {
        throw new Error(result.error || 'Failed to send document');
      }
    } catch (error) {
      console.error('Error sending document:', error);
      toast({
        variant: 'destructive',
        title: 'Send Failed',
        description: error instanceof Error ? error.message : 'Failed to send document. Please try again.',
      });
    }
  };

  const getStatusBadge = (documentType: string) => {
    const status = documentStatuses[documentType] || 'pending';
    
    switch (status) {
      case 'sent':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Sent</Badge>;
      case 'signed':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Signed</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-600">Completed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getStatusIcon = (documentType: string) => {
    const status = documentStatuses[documentType] || 'pending';
    
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-muted-foreground" />;
      case 'sent':
        return <Mail className="h-5 w-5 text-blue-600" />;
      case 'signed':
        return <CheckCircle className="h-5 w-5 text-orange-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (loading || !caseData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/cases/${caseNumber}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Document Signing</h1>
          <p className="text-muted-foreground">Case: {caseNumber}</p>
        </div>
      </div>

      {/* Case Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Case Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Client</Label>
                <p className="text-sm">{caseData.clientName}</p>
              </div>
              
              {/* Editable Email Field */}
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <div className="flex items-center gap-2 mt-1">
                  {isEditingEmail ? (
                    <>
                      <Input
                        type="email"
                        value={editEmailValue}
                        onChange={(e) => setEditEmailValue(e.target.value)}
                        className="flex-1"
                        placeholder="Enter email address"
                      />
                      <Button
                        size="sm"
                        onClick={handleEmailSave}
                        className="p-2"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEmailCancel}
                        className="p-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm flex-1">{caseData.clientEmail || 'Not provided'}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleEmailEdit}
                        className="p-2"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      {caseData.clientEmail && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleTestEmail}
                          className="p-2"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Editable Phone Field */}
              <div>
                <Label className="text-sm font-medium">Phone</Label>
                <div className="flex items-center gap-2 mt-1">
                  {isEditingPhone ? (
                    <>
                      <Input
                        type="tel"
                        value={editPhoneValue}
                        onChange={(e) => setEditPhoneValue(e.target.value)}
                        className="flex-1"
                        placeholder="Enter phone number"
                      />
                      <Button
                        size="sm"
                        onClick={handlePhoneSave}
                        className="p-2"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePhoneCancel}
                        className="p-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm flex-1">{caseData.clientPhone || 'Not provided'}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handlePhoneEdit}
                        className="p-2"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      {caseData.clientPhone && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleTestSMS}
                          className="p-2"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="mt-1">
                  <Badge>{caseData.status}</Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Updated</Label>
                <p className="text-sm">{caseData.lastUpdated}</p>
              </div>
              
              {/* Communication Test Section */}
              <div>
                <Label className="text-sm font-medium">Test Communications</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestEmail}
                    disabled={!caseData.clientEmail}
                    className="text-xs"
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Test Email
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestSMS}
                    disabled={!caseData.clientPhone}
                    className="text-xs"
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Test SMS
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestPrefilledEmail}
                    disabled={!caseData.clientEmail}
                    className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Test Prefilled Form
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Test Brevo email and SMS functionality
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Types */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            Click on any document to preview and customize before sending
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DOCUMENT_TYPES.map((document) => {
              return (
                <Card key={document.type} className="relative cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDocumentClick(document.name)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(document.type)}
                        <CardTitle className="text-lg">{document.name}</CardTitle>
                      </div>
                      {getStatusBadge(document.type)}
                    </div>
                    <CardDescription className="text-sm">
                      {document.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDocumentClick(document.name);
                        }}
                        className="w-full"
                        size="sm"
                        variant="outline"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview & Edit Document
                      </Button>
                      
                      {checkForDraft(document.type) && (
                        <div className="flex items-center justify-center text-xs text-green-600 bg-green-50 p-1 rounded">
                          <Save className="h-3 w-3 mr-1" />
                          Draft Saved
                        </div>
                      )}
                    </div>
                    
                    {!caseData.clientEmail && !caseData.clientPhone && (
                      <p className="text-xs text-muted-foreground mt-2">
                        No contact information available
                      </p>
                    )}
                    {!caseData.clientEmail && caseData.clientPhone && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Email not available
                      </p>
                    )}
                    {caseData.clientEmail && !caseData.clientPhone && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Phone not available
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Click on any document to preview the JotForm with pre-filled case data</p>
            <p>• Review and edit the form fields as needed before sending</p>
            <p>• Choose to send via email or SMS to deliver the form to your client</p>
            <p>• The signature link will expire after 72 hours for security</p>
            <p>• Track the status of each document in real-time</p>
          </div>
        </CardContent>
      </Card>

      {/* Document Preview Modal */}
      {selectedDocument && caseData && (
        <DocumentPreview
          document={selectedDocument}
          caseData={caseData}
          isOpen={previewOpen}
          onClose={() => {
            setPreviewOpen(false);
            setSelectedDocument(null);
          }}
          onFormSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}
