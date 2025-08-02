'use client';

import { Suspense, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

function SignAgreementContent() {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const caseNumber = searchParams.get('case');

    useEffect(() => {
        // If there's a case number, redirect to the document-signing page
        if (caseNumber) {
            toast({
                title: "Redirecting",
                description: "Taking you to the document signing page...",
            });
            router.push(`/document-signing/${caseNumber}`);
        } else {
            // Otherwise, show an error and redirect to cases
            toast({
                variant: "destructive",
                title: "Invalid Access",
                description: "Please access document signing through a specific case.",
            });
            setTimeout(() => router.push('/cases'), 3000);
        }
    }, [caseNumber, router, toast]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        Redirecting...
                    </CardTitle>
                    <CardDescription>
                        Please wait while we redirect you to the correct page.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <AlertDescription>
                            {caseNumber 
                                ? `Redirecting to document signing for case ${caseNumber}...`
                                : "No case specified. Redirecting to cases list..."}
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    );
}

// Wrap the component in a Suspense boundary to properly handle useSearchParams() hook
export default function SignAgreementPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Loading...
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>
        }>
            <SignAgreementContent />
        </Suspense>
    );
}