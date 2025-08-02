"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, Send, Mail, MessageSquare, Save, Edit3, Check, X } from 'lucide-react';
import { convertJotFormField } from '@/lib/jotform-api';
import type { CaseFrontend } from '@/lib/database-schema';

interface JotFormField {
  qid: string;
  type: string;
  text: string;
  name: string;
  required?: string;
  readonly?: string;
  size?: string;
  validation?: string;
  order?: string;
  labelAlign?: string;
  hint?: string;
  options?: string;
  special?: string;
}

interface JotFormSchema {
  id: string;
  username: string;
  title: string;
  height: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_submission: string;
  new: string;
  count: string;
  type: string;
  favorite: string;
  archived: string;
  url: string;
}

interface JotFormQuestions {
  [key: string]: JotFormField;
}

interface FormData {
  form: JotFormSchema;
  questions: JotFormQuestions;
}

interface JotFormRendererProps {
  documentType: 'claims' | 'not-at-fault-rental' | 'certis-rental' | 'authority-to-act' | 'direction-to-pay';
  caseData: CaseFrontend;
  onFormSubmit: (formData: Record<string, any>, method: 'email' | 'sms') => void;
}

export default function JotFormRenderer({ documentType, caseData, onFormSubmit }: JotFormRendererProps) {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // Contact information editing state
  const [clientEmail, setClientEmail] = useState(caseData.clientEmail || '');
  const [clientPhone, setClientPhone] = useState(caseData.clientPhone || '');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  useEffect(() => {
    fetchFormSchema();
  }, [documentType]);

  // Load draft data when form loads
  useEffect(() => {
    if (formData) {
      loadDraft();
    }
  }, [formData, caseData.caseNumber, documentType]);

  // Draft management functions
  const getDraftKey = () => {
    return `draft_${caseData.caseNumber}_${documentType}`;
  };

  const saveDraft = () => {
    try {
      const draftKey = getDraftKey();
      localStorage.setItem(draftKey, JSON.stringify(formValues));
      setDraftSaved(true);
      
      // Reset the saved status after 2 seconds
      setTimeout(() => {
        setDraftSaved(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const loadDraft = () => {
    try {
      const draftKey = getDraftKey();
      const savedDraft = localStorage.getItem(draftKey);
      
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        setFormValues(prev => ({
          ...prev,
          ...draftData
        }));
        setDraftSaved(true);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const fetchFormSchema = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Fetching form schema for document type: ${documentType}`);
      
      const response = await fetch('/api/jotform/schemas');
      if (!response.ok) {
        throw new Error(`Failed to fetch schemas: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch form schemas');
      }
      
      // Log available schemas for debugging
      const availableTypes = Object.keys(result.data || {});
      console.log('📋 Available document types:', availableTypes);
      console.log('📊 API response metadata:', result.documentTypes, result.timestamp);
      
      const documentSchema = result.data[documentType];
      if (!documentSchema) {
        // Enhanced error with debugging information
        const errorDetails = {
          requested: documentType,
          available: availableTypes,
          metadata: result._metadata || 'No metadata available'
        };
        
        console.error('❌ Schema not found. Details:', errorDetails);
        
        // Create a more helpful error message
        let errorMessage = `Schema not found for document type: "${documentType}"`;
        if (availableTypes.length > 0) {
          errorMessage += `\n\nAvailable types: ${availableTypes.join(', ')}`;
        } else {
          errorMessage += '\n\nNo schemas are currently available. This may be due to:';
          errorMessage += '\n• JotForm API connectivity issues';
          errorMessage += '\n• Invalid form IDs in configuration';
          errorMessage += '\n• Network or authentication problems';
        }
        
        // Check if there are any errors in metadata
        if (result._metadata?.errors) {
          errorMessage += '\n\nSchema loading errors:';
          Object.entries(result._metadata.errors).forEach(([type, error]) => {
            errorMessage += `\n• ${type}: ${error}`;
          });
        }
        
        throw new Error(errorMessage);
      }
      
      console.log(`✅ Successfully loaded schema for ${documentType}`);
      console.log(`📊 Schema contains ${Object.keys(documentSchema.questions || {}).length} fields`);
      
      setFormData(documentSchema);
      prefillFormValues(documentSchema);
      
    } catch (err) {
      console.error('❌ Error fetching form schema:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const prefillFormValues = (schema: FormData) => {
    const prefilled: Record<string, any> = {};
    
    Object.entries(schema.questions).forEach(([qid, field]) => {
      const convertedField = convertJotFormField(field);
      const fieldName = convertedField.name.toLowerCase();
      
      // Map case data to form fields based on field names/labels
      if (fieldName.includes('client_name') || fieldName.includes('clientname') || field.text.toLowerCase().includes('client name')) {
        prefilled[qid] = caseData.clientName;
      } else if (fieldName.includes('client_phone') || fieldName.includes('clientphone') || field.text.toLowerCase().includes('client phone')) {
        prefilled[qid] = caseData.clientPhone || '';
      } else if (fieldName.includes('client_email') || fieldName.includes('clientemail') || field.text.toLowerCase().includes('client email')) {
        prefilled[qid] = caseData.clientEmail || '';
      } else if (fieldName.includes('client_address') || field.text.toLowerCase().includes('client address')) {
        prefilled[qid] = `${caseData.clientStreetAddress || ''} ${caseData.clientSuburb || ''} ${caseData.clientState || ''} ${caseData.clientPostcode || ''}`.trim();
      } else if (fieldName.includes('at_fault') || fieldName.includes('atfault') || field.text.toLowerCase().includes('at fault')) {
        if (field.text.toLowerCase().includes('name')) {
          prefilled[qid] = caseData.atFaultPartyName;
        } else if (field.text.toLowerCase().includes('phone')) {
          prefilled[qid] = caseData.atFaultPartyPhone || '';
        } else if (field.text.toLowerCase().includes('email')) {
          prefilled[qid] = caseData.atFaultPartyEmail || '';
        } else if (field.text.toLowerCase().includes('address')) {
          prefilled[qid] = `${caseData.atFaultPartyStreetAddress || ''} ${caseData.atFaultPartySuburb || ''} ${caseData.atFaultPartyState || ''} ${caseData.atFaultPartyPostcode || ''}`.trim();
        }
      } else if (fieldName.includes('case_number') || fieldName.includes('casenumber') || field.text.toLowerCase().includes('case number')) {
        prefilled[qid] = caseData.caseNumber;
      } else if (fieldName.includes('accident_date') || field.text.toLowerCase().includes('accident date')) {
        prefilled[qid] = caseData.accidentDate || '';
      } else if (fieldName.includes('accident_time') || field.text.toLowerCase().includes('accident time')) {
        prefilled[qid] = caseData.accidentTime || '';
      } else if (fieldName.includes('description') || field.text.toLowerCase().includes('description')) {
        prefilled[qid] = caseData.accidentDescription || '';
      } else if (fieldName.includes('insurance') && field.text.toLowerCase().includes('client')) {
        prefilled[qid] = caseData.clientInsuranceCompany || '';
      } else if (fieldName.includes('insurance') && (field.text.toLowerCase().includes('at fault') || field.text.toLowerCase().includes('other'))) {
        prefilled[qid] = caseData.atFaultPartyInsuranceCompany || '';
      } else if (fieldName.includes('claim_number') && field.text.toLowerCase().includes('client')) {
        prefilled[qid] = caseData.clientClaimNumber || '';
      } else if (fieldName.includes('claim_number') && (field.text.toLowerCase().includes('at fault') || field.text.toLowerCase().includes('other'))) {
        prefilled[qid] = caseData.atFaultPartyClaimNumber || '';
      }
    });
    
    setFormValues(prefilled);
  };

  const handleFieldChange = (qid: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [qid]: value
    }));
    // Auto-save draft when fields change (debounced)
    setDraftSaved(false);
  };

  const handleSubmit = async (method: 'email' | 'sms') => {
    setIsSubmitting(true);
    try {
      // Use the current email/phone values (which may have been edited)
      const submissionData = {
        ...formValues,
        clientEmail,
        clientPhone
      };
      await onFormSubmit(submissionData, method);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Contact editing functions
  const handleEmailEdit = () => {
    setIsEditingEmail(true);
  };

  const handleEmailSave = () => {
    setIsEditingEmail(false);
  };

  const handleEmailCancel = () => {
    setClientEmail(caseData.clientEmail || '');
    setIsEditingEmail(false);
  };

  const handlePhoneEdit = () => {
    setIsEditingPhone(true);
  };

  const handlePhoneSave = () => {
    setIsEditingPhone(false);
  };

  const handlePhoneCancel = () => {
    setClientPhone(caseData.clientPhone || '');
    setIsEditingPhone(false);
  };

  const renderField = (qid: string, field: JotFormField) => {
    const convertedField = convertJotFormField(field);
    const value = formValues[qid] || '';
    const isRequired = convertedField.required;
    
    // Skip non-input fields
    if (['heading', 'static', 'button'].includes(convertedField.type)) {
      return (
        <div key={qid} className="col-span-full">
          {convertedField.type === 'heading' && (
            <h3 className="text-lg font-semibold mb-2">{field.text}</h3>
          )}
          {convertedField.type === 'static' && (
            <p className="text-sm text-muted-foreground mb-2">{field.text}</p>
          )}
        </div>
      );
    }

    return (
      <div key={qid} className="space-y-2">
        <Label htmlFor={qid} className="text-sm font-medium">
          {field.text}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        {convertedField.hint && (
          <p className="text-xs text-muted-foreground">{convertedField.hint}</p>
        )}

        {renderInputField(qid, convertedField, value, isRequired)}
      </div>
    );
  };

  const renderInputField = (qid: string, field: any, value: any, isRequired: boolean) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
        return (
          <Input
            id={qid}
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(qid, e.target.value)}
            required={isRequired}
            readOnly={field.readonly}
            placeholder={field.hint || ''}
            className="w-full"
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={qid}
            value={value}
            onChange={(e) => handleFieldChange(qid, e.target.value)}
            required={isRequired}
            readOnly={field.readonly}
            placeholder={field.hint || ''}
            className="w-full min-h-[80px]"
          />
        );

      case 'select':
        return (
          <Select value={value} onValueChange={(val) => handleFieldChange(qid, val)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string, idx: number) => (
                <SelectItem key={idx} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup value={value} onValueChange={(val) => handleFieldChange(qid, val)}>
            {field.options?.map((option: string, idx: number) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${qid}-${idx}`} />
                <Label htmlFor={`${qid}-${idx}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={qid}
              checked={value === true || value === 'true'}
              onCheckedChange={(checked) => handleFieldChange(qid, checked)}
            />
            <Label htmlFor={qid} className="text-sm">
              {field.label || 'Check this box'}
            </Label>
          </div>
        );

      case 'date':
        return (
          <Input
            id={qid}
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(qid, e.target.value)}
            required={isRequired}
            readOnly={field.readonly}
            className="w-full"
          />
        );

      case 'file':
        return (
          <Input
            id={qid}
            type="file"
            onChange={(e) => handleFieldChange(qid, e.target.files?.[0])}
            required={isRequired}
            className="w-full"
          />
        );

      default:
        return (
          <Input
            id={qid}
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(qid, e.target.value)}
            required={isRequired}
            readOnly={field.readonly}
            placeholder={field.hint || ''}
            className="w-full"
          />
        );
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading form schema...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <div className="text-red-500 text-lg font-semibold mb-2">
              📋 Form Schema Error
            </div>
            <div className="text-left max-w-2xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <pre className="text-sm text-red-700 whitespace-pre-wrap font-mono">
                  {error}
                </pre>
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Document Type:</strong> {documentType}</p>
                <p><strong>Case Number:</strong> {caseData.caseNumber}</p>
                <details className="mt-4">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    🔧 Troubleshooting Steps
                  </summary>
                  <div className="mt-2 ml-4 space-y-1 text-xs">
                    <p>• Check if the JotForm API key is valid</p>
                    <p>• Verify the form ID exists and is accessible</p>
                    <p>• Ensure network connectivity to JotForm API</p>
                    <p>• Check browser console for additional error details</p>
                  </div>
                </details>
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={fetchFormSchema} variant="outline">
                🔄 Try Again
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
              >
                🔄 Refresh Page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!formData) {
    return (
      <Card className="w-full">
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            No form data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedFields = Object.entries(formData.questions)
    .map(([qid, field]) => ({ qid, field: convertJotFormField(field), original: field }))
    .sort((a, b) => a.field.order - b.field.order);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>{formData.form.title}</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Pre-filled with case data for {caseData.caseNumber}. Review and modify as needed before sending.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedFields.map(({ qid, original }) => renderField(qid, original))}
        </div>
        
        <div className="space-y-3 pt-6 border-t">
          {/* Save Draft Button */}
          <div className="flex justify-center">
            <Button
              onClick={saveDraft}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {draftSaved ? 'Draft Saved!' : 'Save Draft'}
            </Button>
          </div>
          
          {/* Send Buttons with Inline Contact Editing */}
          <div className="space-y-4">
            {/* Email Section */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Email Delivery</Label>
                {clientEmail && (
                  <span className="text-xs text-muted-foreground">
                    Form will be sent to the email address below
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isEditingEmail ? (
                  <>
                    <Input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="Enter client email address"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleEmailSave}
                      className="px-2"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEmailCancel}
                      className="px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {clientEmail || 'No email address set'}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEmailEdit}
                      className="px-2"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              <Button
                onClick={() => handleSubmit('email')}
                disabled={isSubmitting || !clientEmail}
                className="w-full"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Send Prefilled Form via Email
              </Button>
            </div>

            {/* SMS Section */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">SMS Delivery</Label>
                {clientPhone && (
                  <span className="text-xs text-muted-foreground">
                    Form will be sent to the phone number below
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isEditingPhone ? (
                  <>
                    <Input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Enter client phone number"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handlePhoneSave}
                      className="px-2"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handlePhoneCancel}
                      className="px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {clientPhone || 'No phone number set'}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handlePhoneEdit}
                      className="px-2"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              <Button
                onClick={() => handleSubmit('sms')}
                disabled={isSubmitting || !clientPhone}
                variant="outline"
                className="w-full"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4 mr-2" />
                )}
                Send Prefilled Form via SMS
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}