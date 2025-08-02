'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function FormSuccessContent() {
  const searchParams = useSearchParams();
  const caseNumber = searchParams.get('case');
  const documentType = searchParams.get('document');

  const getDocumentDisplayName = (type: string | null) => {
    switch (type) {
      case 'claims':
        return 'Claims Form';
      case 'authority':
        return 'Authority to Act';
      case 'rental':
        return 'Rental Agreement';
      case 'certis':
        return 'Certis Rental Agreement';
      case 'direction':
        return 'Direction to Pay';
      default:
        return 'Document';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircleIcon className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Form Submitted Successfully!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-gray-600">
              Your <strong>{getDocumentDisplayName(documentType)}</strong> has been submitted and signed successfully.
            </p>
            
            {caseNumber && (
              <p className="text-sm text-gray-500">
                Case Number: <strong>{caseNumber}</strong>
              </p>
            )}
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• Your signed document has been securely stored</li>
              <li>• You will receive a confirmation email shortly</li>
              <li>• Our team will review your submission</li>
              <li>• We'll contact you if any additional information is needed</li>
            </ul>
          </div>
          
          <div className="space-y-3 pt-4">
            <Button 
              onClick={() => window.print()}
              variant="outline"
              className="w-full"
            >
              Print This Page
            </Button>
            
            <Button 
              onClick={() => window.close()}
              className="w-full"
            >
              Close Window
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 pt-4 border-t">
            <p>
              If you have any questions, please contact us at{' '}
              <a href="mailto:support@pbikerescue.com" className="text-blue-600 hover:underline">
                support@pbikerescue.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FormSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <FormSuccessContent />
    </Suspense>
  );
}
