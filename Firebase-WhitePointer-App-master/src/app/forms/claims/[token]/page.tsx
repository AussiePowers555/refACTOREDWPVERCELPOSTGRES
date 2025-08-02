'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CustomClaimsForm from '@/components/forms/CustomClaimsForm';
// Removed direct import of firebase-storage

interface ClaimsFormData {
  // Panel Shop
  panelShopName?: string;
  panelShopContact?: string;
  panelShopPhone?: string;
  repairStartDate?: string;
  vehicleCondition?: string[];

  // Client/Driver
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  clientCity?: string;
  clientState?: string;
  clientPostcode?: string;

  // Owner
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;

  // Insurance
  insuranceCompany?: string;
  claimNumber?: string;

  // Vehicle
  make?: string;
  model?: string;
  year?: string;
  rego?: string;

  // At-fault party
  afDriverName?: string;
  afDriverPhone?: string;
  afDriverEmail?: string;
  afDriverAddress?: string;
  afOwnerName?: string;
  afOwnerPhone?: string;
  afOwnerEmail?: string;
  afInsuranceCompany?: string;
  afClaimNumber?: string;
  afMake?: string;
  afModel?: string;
  afYear?: string;
  afRego?: string;

  // Accident details
  accidentDetails?: string;
  accidentLocation?: string;
  injuries?: boolean;

  // Case info
  caseNumber?: string;
  signature?: string;
}

export default function ClaimsFormPage() {
  const params = useParams();
  const router = useRouter();
  const token = Array.isArray(params.token) ? params.token[0] : params.token as string;
  
  const [formData, setFormData] = useState<ClaimsFormData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load form data based on token
    loadFormData();
  }, [token]);

  const loadFormData = async () => {
    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      
      if (!token) {
        throw new Error('No token provided');
      }
      
      console.log('🔍 Fetching form data with token:', token);
      
      // Fetch form data from API using the token
      const response = await fetch(`/api/forms/claims/${token}`);
      const data = await response.json();
      
      if (!response.ok) {
        console.error('🚨 API error:', data);
        throw new Error(data.error || data.message || 'Failed to load form data');
      }
      
      console.log('✅ Form data loaded successfully');
      setFormData(data.formData || {});
      
    } catch (error: any) {
      console.error('❌ Error loading form data:', error);
      setError(error?.message || 'Failed to load form data. Please check your link and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async (draftData: ClaimsFormData) => {
    try {
      const response = await fetch(`/api/forms/claims/${token}/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ formData: draftData }),
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      // Show success message
      alert('Draft saved successfully!');
      
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft. Please try again.');
    }
  };

  const handleSubmit = async (submittedData: ClaimsFormData & { signature: string }) => {
    try {
      setIsSubmitting(true);
      
      // Generate PDF with signature
      // Create a CaseDetails object for PDF generation
      const caseDetailsForPdf = {
        ...submittedData,
        id: submittedData.caseNumber || 'unknown',
        clientId: submittedData.caseNumber || 'unknown',
        caseNumber: submittedData.caseNumber || 'unknown'
      } as any; // Type assertion to handle complex type compatibility
      
      // Generate PDF using API route
      const pdfResponse = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData: submittedData,
          caseDetails: caseDetailsForPdf,
          signatureDataURL: submittedData.signature
        }),
      });
      
      if (!pdfResponse.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const pdfData = await pdfResponse.json();
      const pdfBlob = new Blob([Buffer.from(pdfData.base64, 'base64')], { type: 'application/pdf' });
      
      // Create form data for file upload
      const formDataForUpload = new FormData();
      formDataForUpload.append('pdf', pdfBlob, `claims-form-${submittedData.caseNumber || 'signed'}.pdf`);
      formDataForUpload.append('formData', JSON.stringify(submittedData));
      formDataForUpload.append('token', token);
      
      // Submit to API
      const response = await fetch(`/api/forms/claims/${token}/submit`, {
        method: 'POST',
        body: formDataForUpload,
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      const result = await response.json();
      
      // Redirect to success page
      router.push(`/forms/success?case=${submittedData.caseNumber}&document=claims`);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Form</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <CustomClaimsForm
        initialData={formData}
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        isLoading={isSubmitting}
      />
      
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-sm">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
    </div>
  );
}
