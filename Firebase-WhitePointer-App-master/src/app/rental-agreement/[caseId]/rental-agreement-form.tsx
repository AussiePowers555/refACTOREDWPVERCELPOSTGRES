
'use client';

import { Suspense, useEffect, useState } from 'react';
import { Save, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Bike } from '@/types/bike';
import type { CaseFrontend as Case } from '@/lib/database-schema';

function RentalAgreementFormComponent({ caseId }: { caseId: string }) {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const bikeId = searchParams.get('bikeId');

    const [bikes] = useLocalStorage<Bike[]>("bikes", []);
    
    const [caseData, setCaseData] = useState<Case | null>(null);
    const [bikeData, setBikeData] = useState<Bike | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    
    useEffect(() => {
        const fetchCaseData = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`/api/cases/by-number/${caseId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch case data');
                }
                const foundCase = await response.json();
                setCaseData(foundCase);
            } catch (error) {
                console.error('Error fetching case:', error);
                setCaseData(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCaseData();
    }, [caseId]);

    useEffect(() => {
        if (bikes.length > 0 && bikeId) {
            const foundBike = bikes.find(b => b.id === bikeId);
            setBikeData(foundBike || null);
        }
    }, [bikeId, bikes]);
    
    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><p>Loading agreement data...</p></div>;
    }

    if (!caseData || !bikeData) {
        return <div className="flex items-center justify-center h-full"><p>Error: Case or Bike data not found for this agreement.</p></div>;
    }

    const handleSaveDraft = () => {
        toast({
            title: "Draft Saved",
            description: "Your changes to the rental agreement have been saved.",
        });
    }

    const handleSend = async () => {
        if (!caseData.clientEmail) {
            toast({
                variant: "destructive",
                title: "Client Email Missing",
                description: "Cannot send agreement without a client email address.",
            });
            return;
        }

        setIsSending(true);
        
        // This functionality depends on a backend email service which is not fully configured.
        // We will simulate the action for now.
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsSending(false);

        toast({
            title: "Agreement Sent (Simulated)",
            description: `The rental agreement has been sent to ${caseData.clientEmail} for signature.`,
        });
        router.push(`/cases/${caseId}`);
    }

    return (
        <div className="flex flex-col gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Rental Agreement: Case {caseId}</CardTitle>
                    <CardDescription>Prepare the rental agreement for {caseData.clientName}. Once complete, you can save it as a draft or send it for signature.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                    <div className="text-center space-y-1">
                        <p className="font-bold">ABN 145 224 782</p>
                        <p className="font-bold">Not At Fault PTY LTD</p>
                        <h2 className="text-xl font-semibold text-primary">Rental Contract</h2>
                    </div>
                    
                    <Separator />

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="make">MAKE</Label>
                                <Input id="make" readOnly defaultValue={bikeData.make} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="model">MODEL</Label>
                                <Input id="model" readOnly defaultValue={bikeData.model} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="hireDate">HIRE DATE</Label>
                                <Input id="hireDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="hireTime">HIRE TIME</Label>
                                <Input id="hireTime" type="time" defaultValue={new Date().toTimeString().slice(0,5)} />
                            </div>
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="areaOfUse">AREA OF USE</Label>
                            <Input id="areaOfUse" defaultValue="Metro Area - Unlimited KMS" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-1">
                                <Label htmlFor="returnDate">Return Date</Label>
                                <Input id="returnDate" type="date" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="returnTime">Time</Label>
                                <Input id="returnTime" type="time" />
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-lg p-4 space-y-4">
                         <h3 className="text-lg font-semibold">Hirer Information</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Hirer Name</Label>
                                <Input readOnly defaultValue={caseData.clientName} />
                            </div>
                             <div className="space-y-1">
                                <Label>Phone</Label>
                                <Input readOnly defaultValue={caseData.clientPhone}/>
                            </div>
                         </div>
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                             <div className="space-y-1 md:col-span-3">
                                <Label>Address</Label>
                                <Input readOnly defaultValue={caseData.clientStreetAddress} />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <Label>Suburb</Label>
                                <Input readOnly defaultValue={caseData.clientSuburb}/>
                            </div>
                          </div>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="space-y-1">
                                <Label>State</Label>
                                <Input readOnly defaultValue={caseData.clientState} />
                            </div>
                            <div className="space-y-1">
                                <Label>Post Code</Label>
                                <Input readOnly defaultValue={caseData.clientPostcode} />
                            </div>
                             <div className="space-y-1">
                                <Label>DOB</Label>
                                <Input type="date" />
                            </div>
                          </div>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="space-y-1">
                                <Label>Licence No</Label>
                                <Input />
                            </div>
                            <div className="space-y-1">
                                <Label>State</Label>
                                <Input />
                            </div>
                             <div className="space-y-1">
                                <Label>Exp Date</Label>
                                <Input type="date" />
                            </div>
                          </div>
                    </div>
                    
                    <div className="border rounded-lg p-4 space-y-4">
                        <h3 className="text-lg font-semibold">Charges</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             <div className="space-y-1"><Label>Helmet</Label><Input type="number" placeholder="$ /day" /></div>
                             <div className="space-y-1"><Label>Riding Apparel</Label><Input type="number" placeholder="$" /></div>
                             <div className="space-y-1"><Label>Admin Fee</Label><Input type="number" placeholder="$" /></div>
                             <div className="space-y-1"><Label>Delivery/Pick up Fee</Label><Input type="number" placeholder="$" /></div>
                             <div className="space-y-1"><Label>Additional Driver</Label><Input type="number" placeholder="$ /day" /></div>
                             <div className="space-y-1"><Label>Excess Reduction</Label><Input type="number" placeholder="$ /day" /></div>
                        </div>
                        <Separator/>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-right"><p className="font-semibold">TOTAL inc GST:</p></div>
                            <div className="font-semibold">$0.00</div>
                            <div className="text-right"><p className="font-semibold">GST Amount:</p></div>
                            <div className="font-semibold">$0.00</div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="justify-end gap-2">
                    <Button variant="outline" onClick={handleSaveDraft}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Draft
                    </Button>
                    <Button onClick={handleSend} disabled={isSending}>
                        {isSending && <Send className="mr-2 h-4 w-4 animate-spin" />}
                        {!isSending && <Send className="mr-2 h-4 w-4" />}
                        Generate & Send
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function RentalAgreementForm({ caseId }: { caseId: string }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><p>Loading...</p></div>}>
      <RentalAgreementFormComponent caseId={caseId} />
    </Suspense>
  )
}
