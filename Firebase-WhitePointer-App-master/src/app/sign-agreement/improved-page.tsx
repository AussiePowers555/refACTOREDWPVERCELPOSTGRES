'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Bike, Loader2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Dynamic import for signature canvas to reduce initial bundle size
import type { ReactSignatureCanvasProps } from 'react-signature-canvas';
type ReactSignatureCanvas = any; // Type alias for compatibility
const SignatureCanvas = dynamic<ReactSignatureCanvas>(() => import("react-signature-canvas").then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="h-[150px] flex items-center justify-center">Loading signature pad...</div>
});

// Type definitions
interface RentalDetails {
  make: string;
  model: string;
  hireDate: string;
  hireTime: string;
  returnDate: string;
  returnTime: string;
  areaOfUse: string;
  hirerName: string;
  phone: string;
  address: string;
  suburb: string;
  state: string;
  postCode: string;
  dob: string;
  licenceNo: string;
  licenceState: string;
  licenceExp: string;
}

interface ChargesDetails {
  helmet?: number;
  ridingApparel?: number;
  adminFee?: number;
  deliveryPickupFee?: number;
  additionalDriver?: number;
  excessReduction?: number;
  totalIncGst: number;
  gstAmount: number;
}

interface SignatureData {
  dataUrl: string;
  timestamp: string;
  ipAddress?: string;
  userAgent: string;
}

// Constants
const REDIRECT_DELAY_MS = 3000;
const SIGNATURE_FORMAT = 'image/png';
const API_ENDPOINTS = {
  validateToken: '/api/signature/validate-token',
  fetchRentalDetails: '/api/signature/rental-details',
  submitAgreement: '/api/signature/submit'
};

// Separate components for better performance and maintainability
const VehicleDetails = memo(({ details }: { details: RentalDetails }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label htmlFor="make">MAKE</Label>
        <Input id="make" readOnly value={details.make} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="model">MODEL</Label>
        <Input id="model" readOnly value={details.model} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="hireDate">HIRE DATE</Label>
        <Input id="hireDate" type="date" readOnly value={details.hireDate} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="hireTime">HIRE TIME</Label>
        <Input id="hireTime" type="time" readOnly value={details.hireTime} />
      </div>
    </div>
    <div className="space-y-1">
      <Label htmlFor="areaOfUse">AREA OF USE</Label>
      <Input id="areaOfUse" readOnly value={details.areaOfUse} />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label htmlFor="returnDate">Return Date</Label>
        <Input id="returnDate" type="date" readOnly value={details.returnDate} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="returnTime">Time</Label>
        <Input id="returnTime" type="time" readOnly value={details.returnTime} />
      </div>
    </div>
  </div>
));

const HirerInformation = memo(({ details }: { details: RentalDetails }) => (
  <div className="border rounded-lg p-4 space-y-4">
    <h3 className="text-lg font-semibold">Hirer Information</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label>Hirer Name</Label>
        <Input readOnly value={details.hirerName} />
      </div>
      <div className="space-y-1">
        <Label>Phone</Label>
        <Input readOnly value={details.phone} />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div className="space-y-1 md:col-span-3">
        <Label>Address</Label>
        <Input readOnly value={details.address} />
      </div>
      <div className="space-y-1 md:col-span-2">
        <Label>Suburb</Label>
        <Input readOnly value={details.suburb} />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-1">
        <Label>State</Label>
        <Input readOnly value={details.state} />
      </div>
      <div className="space-y-1">
        <Label>Post Code</Label>
        <Input readOnly value={details.postCode} />
      </div>
      <div className="space-y-1">
        <Label>DOB</Label>
        <Input 
          type="date" 
          readOnly 
          value={details.dob}
          aria-label="Date of birth"
        />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-1">
        <Label>Licence No</Label>
        <Input 
          readOnly 
          value={details.licenceNo.replace(/\d(?=\d{4})/g, '*')} // Mask license number
          aria-label="Driver license number (partially hidden for security)"
        />
      </div>
      <div className="space-y-1">
        <Label>State</Label>
        <Input readOnly value={details.licenceState} />
      </div>
      <div className="space-y-1">
        <Label>Exp Date</Label>
        <Input type="date" readOnly value={details.licenceExp} />
      </div>
    </div>
  </div>
));

const ChargesSection = memo(({ charges }: { charges: ChargesDetails }) => (
  <div className="border rounded-lg p-4 space-y-4">
    <h3 className="text-lg font-semibold">Charges</h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="space-y-1">
        <Label>Helmet</Label>
        <Input readOnly value={charges.helmet ? `$${charges.helmet}/day` : '$ /day'} />
      </div>
      <div className="space-y-1">
        <Label>Riding Apparel</Label>
        <Input readOnly value={charges.ridingApparel ? `$${charges.ridingApparel}` : '$'} />
      </div>
      <div className="space-y-1">
        <Label>Admin Fee</Label>
        <Input readOnly value={charges.adminFee ? `$${charges.adminFee}` : '$'} />
      </div>
      <div className="space-y-1">
        <Label>Delivery/Pick up Fee</Label>
        <Input readOnly value={charges.deliveryPickupFee ? `$${charges.deliveryPickupFee}` : '$'} />
      </div>
      <div className="space-y-1">
        <Label>Additional Driver</Label>
        <Input readOnly value={charges.additionalDriver ? `$${charges.additionalDriver}/day` : '$ /day'} />
      </div>
      <div className="space-y-1">
        <Label>Excess Reduction</Label>
        <Input readOnly value={charges.excessReduction ? `$${charges.excessReduction}/day` : '$ /day'} />
      </div>
    </div>
    <Separator />
    <div className="grid grid-cols-2 gap-4">
      <div className="text-right">
        <p className="font-semibold">TOTAL inc GST:</p>
      </div>
      <div className="font-semibold">${charges.totalIncGst.toFixed(2)}</div>
      <div className="text-right">
        <p className="font-semibold">GST Amount:</p>
      </div>
      <div className="font-semibold">${charges.gstAmount.toFixed(2)}</div>
    </div>
  </div>
));

export default function ImprovedSignAgreementPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sigPadRef = useRef<ReactSignatureCanvas>(null);
  const redirectTimeoutRef = useRef<NodeJS.Timeout>();

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [rentalDetails, setRentalDetails] = useState<RentalDetails | null>(null);
  const [charges, setCharges] = useState<ChargesDetails | null>(null);
  const [fullName, setFullName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signatureStatus, setSignatureStatus] = useState<'empty' | 'signed'>('empty');
  const [error, setError] = useState<string | null>(null);

  // Token validation and data fetching
  useEffect(() => {
    const validateAndFetchData = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setError('Invalid or missing token');
        setIsLoading(false);
        return;
      }

      try {
        // Validate token
        const tokenResponse = await fetch(API_ENDPOINTS.validateToken, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });

        if (!tokenResponse.ok) {
          throw new Error('Invalid token');
        }

        const { caseId } = await tokenResponse.json();
        setIsAuthenticated(true);

        // Fetch rental details
        const detailsResponse = await fetch(`${API_ENDPOINTS.fetchRentalDetails}/${caseId}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': getCsrfToken() // Implement CSRF protection
          }
        });

        if (!detailsResponse.ok) {
          throw new Error('Failed to fetch rental details');
        }

        const data = await detailsResponse.json();
        setRentalDetails(data.rentalDetails);
        setCharges(data.charges);
        setFullName(data.rentalDetails.hirerName);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setIsLoading(false);
      }
    };

    validateAndFetchData();
  }, [searchParams]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  // Memoized callbacks
  const clearSignature = useCallback(() => {
    sigPadRef.current?.clear();
    setSignatureStatus('empty');
    // Return focus to signature area for accessibility
    document.getElementById('signature-label')?.focus();
  }, []);

  const handleSignatureEnd = useCallback(() => {
    if (!sigPadRef.current?.isEmpty()) {
      setSignatureStatus('signed');
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isAuthenticated || !rentalDetails) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Please refresh the page and try again."
      });
      return;
    }

    // Validate form
    if (sigPadRef.current?.isEmpty()) {
      toast({
        variant: "destructive",
        title: "Signature Required",
        description: "Please provide your signature before submitting."
      });
      document.getElementById('signature-label')?.focus();
      return;
    }

    if (!termsAccepted) {
      toast({
        variant: "destructive",
        title: "Terms Not Accepted",
        description: "Please accept the terms and conditions."
      });
      return;
    }

    if (!fullName.trim()) {
      toast({
        variant: "destructive",
        title: "Name Required",
        description: "Please enter your full name."
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate signature data
      const signatureDataUrl = sigPadRef.current?.getTrimmedCanvas().toDataURL(SIGNATURE_FORMAT);
      
      if (!signatureDataUrl) {
        throw new Error('Failed to capture signature');
      }

      const signatureData: SignatureData = {
        dataUrl: signatureDataUrl,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };

      // Submit to backend
      const token = searchParams.get('token');
      const response = await fetch(API_ENDPOINTS.submitAgreement, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({
          signature: signatureData,
          fullName,
          acceptedTerms: termsAccepted,
          rentalDetails
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Submission failed');
      }

      toast({
        title: "Agreement Signed Successfully",
        description: "Thank you! You will receive a copy via email shortly."
      });

      // Redirect after success
      redirectTimeoutRef.current = setTimeout(async () => {
        try {
          await router.push('/sign-agreement/success');
        } catch (error) {
          window.location.href = '/sign-agreement/success';
        }
      }, REDIRECT_DELAY_MS);

    } catch (err) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: err instanceof Error ? err.message : "Please try again later."
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, rentalDetails, termsAccepted, fullName, searchParams, toast, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Error state
  if (error || !rentalDetails || !charges) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                {error || 'Unable to load rental agreement. Please contact support.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 sm:p-6 md:p-8">
      <div className="flex items-center gap-2 mb-6">
        <Bike className="h-8 w-8 text-primary" />
        <span className="text-2xl font-semibold">PBikeRescue</span>
      </div>
      
      <Card className="w-full max-w-4xl">
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-8">
            {/* Header */}
            <div className="text-center space-y-1">
              <p className="font-bold">ABN 145 224 782</p>
              <p className="font-bold">Not At Fault PTY LTD</p>
              <h1 className="text-xl font-semibold text-primary">Rental Contract</h1>
            </div>
            
            <Separator />

            {/* Vehicle and Hire Details */}
            <VehicleDetails details={rentalDetails} />

            {/* Hirer Information */}
            <HirerInformation details={rentalDetails} />
            
            {/* Charges */}
            <ChargesSection charges={charges} />

            {/* Terms and Signature */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="terms-content">Terms and Conditions</Label>
                <div 
                  id="terms-content"
                  className="h-32 overflow-y-auto rounded-md border p-4 text-sm text-muted-foreground space-y-2"
                  tabIndex={0}
                  role="region"
                  aria-label="Terms and conditions"
                >
                  <p>PENALTY Notice will be charged $40 per notice</p>
                  <p>Fuel to be returned at same level provided</p>
                  <p>Driver is responsible for tolls and traffic fines</p>
                  <p>The hirer agrees to return the motorcycle in the same condition as received</p>
                  <p>Any damage not covered by insurance will be the responsibility of the hirer</p>
                  <p>Late returns may incur additional charges at the daily rate</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signature-canvas" id="signature-label">
                  Digital Signature *
                </Label>
                <div 
                  className="rounded-md border border-input bg-background"
                  role="img"
                  aria-label="Signature pad - use mouse or touch to sign"
                  aria-describedby="signature-instructions"
                >
                  <SignatureCanvas 
                    ref={sigPadRef}
                    penColor="black"
                    canvasProps={{ 
                      className: 'w-full h-[150px]',
                      id: 'signature-canvas'
                    }}
                    onEnd={handleSignatureEnd}
                  />
                </div>
                <span id="signature-instructions" className="sr-only">
                  Draw your signature using mouse or touch. Press Clear Signature button to start over.
                </span>
                <Button 
                  type="button" 
                  variant="link" 
                  size="sm" 
                  onClick={clearSignature} 
                  className="p-0 h-auto"
                  disabled={signatureStatus === 'empty'}
                >
                  Clear Signature
                </Button>
                <div aria-live="polite" aria-atomic="true" className="sr-only">
                  {signatureStatus === 'signed' ? 'Signature captured' : 'Signature area cleared'}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input 
                  id="fullName" 
                  placeholder="Type your full name" 
                  required 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isSubmitting}
                  aria-required="true"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms" 
                  required 
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                  disabled={isSubmitting}
                  aria-required="true"
                />
                <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                  I have read, understood, and hereby accept the terms and conditions of this agreement *
                </Label>
              </div>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || !termsAccepted || signatureStatus === 'empty'}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Sign and Submit Agreement'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

// Utility functions
function getCsrfToken(): string {
  // Implementation would get CSRF token from meta tag or cookie
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

// Add React.memo import
import { memo } from 'react';