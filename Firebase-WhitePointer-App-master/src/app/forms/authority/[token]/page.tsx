'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CustomAuthorityToActForm from '@/components/forms/CustomAuthorityToActForm';

interface AuthorityToActFormData {
  // Case reference
  caseReference?: string;
  
  // Not at fault party details
  notAtFaultFirstName?: string;
  notAtFaultLastName?: string;
  accidentDate?: string;
  
  // Vehicle details
  regoNumber?: string;
  insuranceCompany?: string;
  claimNumber?: string;
  
  // At fault party details
  atFaultFirstName?: string;
  atFaultLastName?: string;
  atFaultRegoNumber?: string;
  atFaultInsuranceCompany?: string;
  atFaultClaimNumber?: string;
  
  // Signatures and dates
  notAtFaultSignature?: string;
  notAtFaultSignatureDate?: string;
  atFaultSignature?: string;
  atFaultSignatureDate?: string;
  
  // Case info
  caseNumber?: string;
}

interface TokenData {
  success: boolean;
  formData: AuthorityToActFormData;
  caseId: string;
  documentType: string;
  status: string;
}

export default function AuthorityToActFormPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [formData, setFormData] = useState<AuthorityToActFormData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        console.log('🔄 Loading Authority to Act form data for token:', token);
        
        const response = await fetch(`/api/forms/authority/${token}`);
        const data: TokenData = await response.json();
        
        if (!response.ok) {
          throw new Error((data as any).error || 'Failed to load form data');
        }
        
        console.log('✅ Authority to Act form data loaded:', data);
        setFormData(data.formData || {});
        
      } catch (err) {
        console.error('❌ Error loading Authority to Act form data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load form data. Please check your link and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      loadFormData();
    }
  }, [token]);

  const handleSubmit = async (submissionData: AuthorityToActFormData & { 
    notAtFaultSignature: string; 
    atFaultSignature: string; 
  }) => {
    setIsSubmitting(true);
    
    try {
      console.log('🔄 Submitting Authority to Act form:', submissionData);
      
      const response = await fetch(`/api/forms/authority/${token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit form');
      }
      
      console.log('✅ Authority to Act form submitted successfully:', result);
      
      // Show success message and redirect
      alert('Authority to Act form submitted successfully!');
      router.push('/forms/success');
      
    } catch (err) {
      console.error('❌ Error submitting Authority to Act form:', err);
      alert(err instanceof Error ? err.message : 'Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (draftData: AuthorityToActFormData) => {
    try {
      console.log('🔄 Saving Authority to Act form draft:', draftData);
      
      const response = await fetch(`/api/forms/authority/${token}/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save draft');
      }
      
      console.log('✅ Authority to Act form draft saved:', result);
      alert('Draft saved successfully!');
      
    } catch (err) {
      console.error('❌ Error saving Authority to Act form draft:', err);
      alert(err instanceof Error ? err.message : 'Failed to save draft. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Authority to Act form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Form</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomAuthorityToActForm
        initialData={formData}
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        isLoading={isSubmitting}
      />
    </div>
  );
}
