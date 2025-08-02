'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  FileText, 
  Clock, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle,
  Loader2 
} from 'lucide-react';
import { DOCUMENT_TYPES } from '@/lib/database-schema';

interface TokenData {
  isValid: boolean;
  isExpired: boolean;
  isCompleted: boolean;
  caseNumber?: string;
  clientName?: string;
  documentType?: string;
  formLink?: string;
  expiresAt?: string;
  error?: string;
}

export default function SecureSignaturePortalPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/signature-portal/validate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();
      setTokenData(result);
    } catch (error) {
      console.error('Error validating token:', error);
      setTokenData({
        isValid: false,
        isExpired: false,
        isCompleted: false,
        error: 'Failed to validate signature link. Please try again or contact support.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToSignature = async () => {
    if (!tokenData?.formLink) return;

    setRedirecting(true);
    
    try {
      // Mark token as accessed
      await fetch(`/api/signature-portal/mark-accessed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      // Redirect to JotForm
      window.open(tokenData.formLink, '_blank');
    } catch (error) {
      console.error('Error marking token as accessed:', error);
      // Still proceed to JotForm even if marking fails
      window.open(tokenData.formLink, '_blank');
    } finally {
      setRedirecting(false);
    }
  };

  const formatExpiryTime = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs <= 0) return 'Expired';
    if (diffHours > 0) return `${diffHours}h ${diffMinutes}m remaining`;
    return `${diffMinutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-muted-foreground">Validating signature link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Secure Signature Portal</h1>
          <p className="text-muted-foreground mt-2">White Pointer Recoveries</p>
        </div>

        {/* Main Content */}
        {!tokenData?.isValid ? (
          <Card className="border-red-200" data-testid="invalid-token-message">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <CardTitle className="text-red-900">Invalid Signature Link</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>
                  {tokenData?.error || 'This signature link is invalid or has been tampered with. Please contact White Pointer Recoveries for a new link.'}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : tokenData.isExpired ? (
          <Card className="border-orange-200" data-testid="expired-token-message">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-orange-900">Signature Link Expired</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  This signature link has expired for security reasons. Signature links are valid for 72 hours. 
                  Please contact White Pointer Recoveries to request a new signature link.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : tokenData.isCompleted ? (
          <Card className="border-green-200" data-testid="completed-token-message">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle className="text-green-900">Document Already Signed</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  This document has already been signed and processed. Thank you for completing the signature process.
                  If you need a copy of the signed document, please contact White Pointer Recoveries.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : (
          <Card data-testid="signature-portal">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Digital Signature Required
              </CardTitle>
              <CardDescription>
                Please review the document details below and proceed to sign
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6" data-testid="case-info">
              {/* Case Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Case Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Case Number:</span>
                    <p className="text-muted-foreground">{tokenData.caseNumber}</p>
                  </div>
                  <div>
                    <span className="font-medium">Client Name:</span>
                    <p className="text-muted-foreground">{tokenData.clientName}</p>
                  </div>
                  <div>
                    <span className="font-medium">Document Type:</span>
                    <p className="text-muted-foreground">
                      {tokenData.documentType && DOCUMENT_TYPES[tokenData.documentType as keyof typeof DOCUMENT_TYPES]?.name}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Link Expires:</span>
                    <p className="text-muted-foreground">
                      {tokenData.expiresAt && formatExpiryTime(tokenData.expiresAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  This is a secure signature portal. Your information is encrypted and protected. 
                  The signature link will expire automatically for your security.
                </AlertDescription>
              </Alert>

              {/* Action Button */}
              <div className="text-center">
                <Button
                  onClick={handleProceedToSignature}
                  disabled={redirecting}
                  size="lg"
                  className="w-full md:w-auto"
                  data-testid="proceed-to-signature"
                >
                  {redirecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Opening Signature Form...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Proceed to Sign Document
                    </>
                  )}
                </Button>
              </div>

              {/* Instructions */}
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium">What happens next:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>You'll be redirected to a secure JotForm with your case information pre-filled</li>
                  <li>Review the document details and provide your digital signature</li>
                  <li>Once signed, the document will be automatically processed</li>
                  <li>You'll receive a confirmation email when the process is complete</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2024 White Pointer Recoveries Pty Ltd. All rights reserved.</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </div>
    </div>
  );
}
