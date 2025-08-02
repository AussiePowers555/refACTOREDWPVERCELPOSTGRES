"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, PackageCheck, Wrench, Edit, Trash2, DollarSign, Calendar, Settings, Loader2 } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AssignCaseForm } from "./assign-case-form";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useContacts, useBikes } from "@/hooks/use-database";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { BikeFrontend as Bike, CaseFrontend as Case, ContactFrontend as Contact } from "@/lib/database-schema";
import {
  calculateBikeRates,
  formatCurrency,
  formatDate,
  getBikeStatusInfo,
  getAssignmentSummary
} from "@/lib/bike-utils";

const initialCases = [
    { caseNumber: "2025-001", clientName: "John Smith", clientEmail: "john.s@example.com", atFaultPartyName: "Jane Doe", status: "Under Repair", lastUpdated: "2 hours ago"},
    { caseNumber: "2025-002", clientName: "Emma Thompson", clientEmail: "emma.t@example.com", atFaultPartyName: "Tom Wilson", status: "Processing", lastUpdated: "1 day ago" },
    { caseNumber: "2024-135", clientName: "Michael Chen", clientEmail: "michael.c@example.com", atFaultPartyName: "Susan White", status: "Overdue", lastUpdated: "3 days ago" },
    { caseNumber: "2025-003", clientName: "Olivia Wilson", clientEmail: "olivia.w@example.com", atFaultPartyName: "Robert Brown", status: "New Matter", lastUpdated: "5 days ago" },
];

export default function FleetPage() {
  const router = useRouter();
  const [isAssignCaseDialogOpen, setAssignCaseDialogOpen] = useState(false);
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: bikes, loading: bikesLoading, error: bikesError, update: updateBike, remove: deleteBike, refresh: refetchBikes } = useBikes();
  const [cases, setCases] = useState<Case[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const { data: contacts } = useContacts();

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setCasesLoading(true);
        const response = await fetch('/api/cases');
        if (!response.ok) {
          throw new Error('Failed to fetch cases');
        }
        const casesData = await response.json();
        setCases(casesData);
      } catch (error) {
        console.error('Error fetching cases:', error);
        setCases([]); // Fallback to empty array
      } finally {
        setCasesLoading(false);
      }
    };

    fetchCases();
  }, []);
  
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Get Service Center contacts
  const getServiceCenterContacts = () => (contacts as Contact[]).filter(c => c.type === 'Service Center');
  
  // Get contact name by ID
  const getContactName = (contactId?: string) => {
    if (!contactId) return '';
    const contact = (contacts as Contact[]).find(c => c.id === contactId);
    return contact?.name || '';
  };

  const handleAssignBikeToCase = async (bikeId: string, caseNumber: string, startDate: string, endDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    const assignmentStartDate = startDate || today;
    const assignmentEndDate = endDate || '';
    
    try {
      await updateBike(bikeId, {
        status: 'assigned',
        assignment: caseNumber,
        location: 'On-road',
        assignedCaseId: caseNumber,
        assignmentStartDate,
        assignmentEndDate
      });
      
      await refetchBikes();
      
      toast({
        title: "Bike Assigned",
        description: `Bike ${bikeId} has been assigned to case ${caseNumber}.`,
      });
      router.push(`/cases/${caseNumber}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to assign bike to case.",
      });
    }
  };

  const handleReturnBike = async (bikeId: string) => {
    try {
      await updateBike(bikeId, {
        status: 'available',
        assignment: '-',
        location: 'Main Warehouse',
        assignedCaseId: '',
        assignmentStartDate: '',
        assignmentEndDate: ''
      });
      
      await refetchBikes();
      
      toast({
        title: "Bike Returned",
        description: `Bike ${bikeId} has been returned and is now available.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to return bike.",
      });
    }
  };

  const handleServiceCenterAssignment = async (bikeId: string, serviceCenterContactId: string) => {
    const serviceCenterName = serviceCenterContactId === 'none' ? '' : getContactName(serviceCenterContactId);
    
    try {
      await updateBike(bikeId, {
        serviceCenterContactId: serviceCenterContactId === 'none' ? '' : serviceCenterContactId,
        status: serviceCenterContactId === 'none' ? 'available' : 'maintenance',
        location: serviceCenterContactId === 'none' ? 'Main Warehouse' : serviceCenterName || 'Service Center'
      });
      
      await refetchBikes();
      
      toast({
        title: serviceCenterContactId === 'none' ? "Service Assignment Removed" : "Service Center Assigned",
        description: serviceCenterContactId === 'none'
          ? `Bike ${bikeId} is no longer assigned to a service center.`
          : `Bike ${bikeId} has been assigned to ${serviceCenterName} for maintenance.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update service center assignment.",
      });
    }
  };
  
  const handleDeleteBike = async (bikeId: string) => {
    try {
      await deleteBike(bikeId);
      await refetchBikes();
      
      toast({
        variant: "destructive",
        title: "Bike Deleted",
        description: `Bike ${bikeId} has been removed from the fleet.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete bike.",
      });
    }
  }

  const handlePrepareAgreement = (bike: Bike) => {
    if (!bike.assignment || bike.assignment === '-') {
        toast({ variant: "destructive", title: "Error", description: "Bike is not assigned to a case." });
        return;
    }
    router.push(`/rental-agreement/${bike.assignment}?bikeId=${bike.id}`);
  };

  const openAssignDialog = (bike: Bike) => {
    setSelectedBike(bike);
    setAssignCaseDialogOpen(true);
  }
  
  if (!isClient) {
    return null;
  }

  if (bikesLoading || casesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (bikesError) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        Error loading bikes. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fleet Tracking</h1>
        <Button onClick={() => router.push('/fleet/new')}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Bike
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Available Bikes ({bikes.length})</CardTitle>
          <CardDescription>Ready for assignment to cases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="Search bikes..." 
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(bikes as Bike[]).map(bike => {
              const statusInfo = getBikeStatusInfo(bike);
              const assignmentSummary = getAssignmentSummary(bike);
              const assignmentDuration = bike.assignmentStartDate && bike.assignmentEndDate
                ? Math.ceil((new Date(bike.assignmentEndDate).getTime() - new Date(bike.assignmentStartDate).getTime()) / (1000 * 60 * 60 * 24))
                : null;
              
              return (
                <Card key={bike.id}>
                  <CardHeader className="p-0">
                    <Image
                      alt={`${bike.make} ${bike.model}`}
                      className="aspect-video w-full rounded-t-lg object-cover"
                      height="200"
                      src={bike.imageUrl || 'https://placehold.co/300x200.png'}
                      width="300"
                      data-ai-hint={bike.imageHint}
                    />
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{`${bike.make} ${bike.model}`}</h3>
                      <Badge variant={bike.status === 'available' ? 'default' : bike.status === 'assigned' ? 'secondary' : 'destructive'}>
                        {bike.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{bike.id}</p>
                    <p className="text-sm text-muted-foreground">
                      Location: {bike.location}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Registration: {bike.registration}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expires: {bike.registrationExpires ? formatDate(bike.registrationExpires) : 'N/A'}
                    </p>
                    
                    {/* Daily Rates */}
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>Rate A: {formatCurrency(bike.dailyRateA || 85)}</span>
                      <span className="text-muted-foreground">|</span>
                      <span>Rate B: {formatCurrency(bike.dailyRateB || 95)}</span>
                    </div>
                    
                    {/* Assignment Duration */}
                    {bike.status === 'assigned' && assignmentDuration && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Calendar className="h-4 w-4" />
                        <span>{assignmentDuration} days</span>
                      </div>
                    )}
                    
                    {/* Service Center Assignment */}
                    {bike.serviceCenterContactId && (
                      <div className="mt-3 p-2 bg-orange-50 rounded-md">
                        <div className="flex items-center gap-2 text-sm">
                          <Settings className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-orange-900">
                            At {getContactName(bike.serviceCenterContactId)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Service Center Dropdown */}
                    <div className="mt-3">
                      <Select 
                        value={bike.serviceCenterContactId || 'none'} 
                        onValueChange={(value) => handleServiceCenterAssignment(bike.id, value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select Service Center" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Service Center</SelectItem>
                          {getServiceCenterContacts().map(contact => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2 p-4 pt-0">
                      <Button variant="outline" className="w-full" onClick={() => router.push(`/fleet/edit/${bike.id}`)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit Bike
                      </Button>
                      <Button 
                          variant="secondary" 
                          className="w-full bg-green-600 hover:bg-green-700 text-white" 
                          onClick={() => openAssignDialog(bike)}
                          disabled={bike.status !== 'available'}
                      >
                         <PackageCheck className="mr-2 h-4 w-4" /> Assign Bike
                      </Button>
                      <Button 
                          variant="secondary" 
                          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                          onClick={() => handleReturnBike(bike.id)}
                          disabled={bike.status !== 'assigned'}
                      >
                          <Wrench className="mr-2 h-4 w-4" /> Return Bike
                      </Button>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="link" className="text-destructive hover:text-destructive/80">
                             <Trash2 className="mr-2 h-4 w-4"/> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the bike
                              from the fleet.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteBike(bike.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </CardFooter>
                </Card>
              );
            })}
           </div>
        </CardContent>
      </Card>
      
      {selectedBike && (
         <Dialog open={isAssignCaseDialogOpen} onOpenChange={setAssignCaseDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assign Bike to Case</DialogTitle>
                    <DialogDescription>
                        Assign bike <span className="font-semibold">{selectedBike.model} ({selectedBike.id})</span> to an existing case.
                    </DialogDescription>
                </DialogHeader>
                <AssignCaseForm 
                    bike={selectedBike}
                    cases={cases.filter(c => !(bikes as Bike[]).some(b => b.assignment === c.caseNumber))}
                    onAssign={handleAssignBikeToCase}
                    setDialogOpen={setAssignCaseDialogOpen}
                />
            </DialogContent>
         </Dialog>
      )}
    </div>
  );
}