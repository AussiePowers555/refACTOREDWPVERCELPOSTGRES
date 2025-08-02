
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from 'next/navigation';
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { CaseFrontend as Case, ContactFrontend as Contact } from "@/lib/database-schema";
import type { BikeFrontend } from "@/lib/database-schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bike as BikeIcon, FileText, PenTool } from "lucide-react";
import Link from 'next/link';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { EmailForm } from "@/app/(app)/ai-email/email-form";
import CommunicationLog from "./communication-log";
import { CaseDetailForm } from "./case-detail-form";
import { useToast } from "@/hooks/use-toast";
import AccidentDetails from "./accident-details";
import ImageGallery from "./image-gallery";
import PdfViewer from "./pdf-viewer";
import DocumentUpload from "./document-upload";

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;
  const { toast } = useToast();

  const [bikes] = useLocalStorage<BikeFrontend[]>("bikes", []);
  const [contacts, setContacts] = useLocalStorage<Contact[]>("contacts", []);

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [assignedBike, setAssignedBike] = useState<BikeFrontend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [displaySection, setDisplaySection] = useState<'details' | 'gallery' | 'pdfs' | 'upload'>('details');

  useEffect(() => {
    const fetchCaseData = async () => {
      if (!caseId || caseId === 'undefined') {
        setError('Invalid case ID');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Directly fetch case by ID
        const caseResponse = await fetch(`/api/cases/${caseId}`);
        if (!caseResponse.ok) {
          setError('Case not found');
          setLoading(false);
          return;
        }

        const currentCase: Case = await caseResponse.json();
        setCaseData(currentCase);

        // Find assigned bike by case ID
        if (bikes.length > 0) {
          const bike = bikes.find(b => b.assignedCaseId === currentCase.id);
          setAssignedBike(bike || null);
        }
      } catch (err) {
        console.error('Error fetching case data:', err);
        setError('Failed to load case data');
      } finally {
        setLoading(false);
      }
    };

    fetchCaseData();
  }, [caseId, bikes]);

  const handleCaseUpdate = async (updatedData: Partial<Case>) => {
    if (!caseData) return;

    const updatedCaseWithTimestamp: Case = {
      ...caseData,
      ...updatedData,
      lastUpdated: 'Just now',
    };

    try {
      const response = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCaseWithTimestamp),
      });

      if (!response.ok) {
        throw new Error('Failed to update case');
      }

      setCaseData(updatedCaseWithTimestamp);
      toast({
        title: "Case Updated",
        description: `Details for case ${updatedCaseWithTimestamp.caseNumber} have been saved.`,
      });
    } catch (error) {
      console.error('Error updating case:', error);
      toast({
        title: "Error",
        description: "Failed to update case. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddContact = (contact: Omit<Contact, 'id'>): Contact => {
    const newContact: Contact = {
      id: `cont-${Date.now()}`,
      ...contact,
    };
    setContacts(prev => [newContact, ...prev]);
    toast({
        title: "Contact Added",
        description: `New contact ${newContact.name} has been added.`
    })
    return newContact;
  }
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p>Loading case data...</p>
        <Link href="/cases" className="text-sm flex items-center gap-2 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Cases
        </Link>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-red-600">{error || 'Case not found'}</p>
        <Link href="/cases" className="text-sm flex items-center gap-2 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Cases
        </Link>
      </div>
    );
  }

  const renderSection = () => {
    switch(displaySection) {
      case 'details':
        return (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <CaseDetailForm
                  caseData={caseData}
                  onCaseUpdate={handleCaseUpdate}
                  contacts={contacts}
                  onAddContact={handleAddContact}
                />
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-6">
                 <AccidentDetails caseData={caseData} onCaseUpdate={handleCaseUpdate} />
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BikeIcon /> Assigned Bike</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assignedBike ? (
                      <div className="space-y-4">
                        <Image
                          src={assignedBike.imageUrl || '/placeholder-bike.jpg'}
                          alt={`${assignedBike.make} ${assignedBike.model}`}
                          width={300}
                          height={200}
                          className="w-full rounded-md object-cover aspect-video"
                          data-ai-hint={assignedBike.imageHint}
                        />
                        <div className="text-sm space-y-1">
                          <h4 className="font-semibold text-base">{assignedBike.make} {assignedBike.model}</h4>
                          <p><strong>ID:</strong> {assignedBike.id}</p>
                          <p><strong>Registration:</strong> {assignedBike.registration}</p>
                          <p><strong>Status:</strong> <Badge>{assignedBike.status}</Badge></p>
                          <p><strong>Location:</strong> {assignedBike.location}</p>
                        </div>
                        <div className="space-y-2">
                          <Button
                            className="w-full"
                            onClick={() => router.push(`/rental-agreement/${caseData.caseNumber}?bikeId=${assignedBike.id}`)}
                          >
                            <FileText className="mr-2 h-4 w-4" /> Prepare Rental Agreement
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push(`/document-signing/${caseData.caseNumber}`)}
                          >
                            <PenTool className="mr-2 h-4 w-4" /> Send Documents for Signature
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No bike assigned to this case.</p>
                        <Button variant="link" onClick={() => router.push('/fleet')}>Assign a bike</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="mt-4">
              <EmailForm caseNumber={caseId} />
            </div>

            <div className="mt-4">
              <CommunicationLog caseNumber={caseId} />
            </div>
          </>
        );
      case 'gallery':
        return <ImageGallery caseNumber={caseId} />;
      case 'pdfs':
        return <PdfViewer caseNumber={caseId} />;
      case 'upload':
        return <DocumentUpload caseNumber={caseId} />;
      default:
        return null;
    }
  }


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Case Details: {caseData.caseNumber}</h1>
          <div className="text-muted-foreground flex items-center gap-2">
            Status: <Badge variant={caseData.status === 'Paid' ? 'default' : caseData.status === 'Settlement Agreed' ? 'secondary' : 'outline'}>{caseData.status}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push(`/document-signing/${caseData.caseNumber}`)}
            className="flex items-center gap-2"
          >
            <PenTool className="h-4 w-4" />
            Sign Documents
          </Button>
          <Link href="/cases" className="text-sm flex items-center gap-2 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Cases
          </Link>
        </div>
      </div>

      {/* Navigation/Tabs for sections */}
      <div className="flex gap-2 border-b pb-4">
        <Button variant={displaySection === 'details' ? 'secondary' : 'ghost'} onClick={() => setDisplaySection('details')}>
          Case Details
        </Button>
        <Button variant={displaySection === 'gallery' ? 'secondary' : 'ghost'} onClick={() => setDisplaySection('gallery')}>
          Gallery
        </Button>
         <Button variant={displaySection === 'pdfs' ? 'secondary' : 'ghost'} onClick={() => setDisplaySection('pdfs')}>
          PDFs
        </Button>
         <Button variant={displaySection === 'upload' ? 'secondary' : 'ghost'} onClick={() => setDisplaySection('upload')}>
          Upload
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.push(`/document-signing/${caseData.caseNumber}`)}
          className="flex items-center gap-2"
        >
          <PenTool className="h-4 w-4" />
          Sign Documents
        </Button>
      </div>

      {renderSection()}
    </div>
  );
}
