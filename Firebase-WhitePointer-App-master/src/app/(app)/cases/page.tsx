
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown, FilterX, Search, X, Trash2, Database, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewCaseForm } from "./new-case-form";
import { useSessionStorage } from "@/hooks/use-session-storage";
import { useCases, useWorkspaces, useContacts } from "@/hooks/use-database";
import CommunicationLog from "./[caseId]/communication-log";
// Import from unified schema - SINGLE SOURCE OF TRUTH
import type {
  CaseFrontend as Case,
  WorkspaceFrontend as Workspace,
  ContactFrontend as Contact
} from "@/lib/database-schema";

// Import CaseFormValues type for form handling
type CaseFormValues = {
  caseNumber?: string;
  rentalCompany: string;
  lawyer?: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  clientStreetAddress?: string;
  clientSuburb?: string;
  clientState?: string;
  clientPostcode?: string;
  clientClaimNumber?: string;
  clientInsuranceCompany?: string;
  clientInsurer?: string;
  atFaultPartyName: string;
  atFaultPartyPhone?: string;
  atFaultPartyEmail?: string;
  atFaultPartyStreetAddress?: string;
  atFaultPartySuburb?: string;
  atFaultPartyState?: string;
  atFaultPartyPostcode?: string;
  atFaultPartyClaimNumber?: string;
  atFaultPartyInsuranceCompany?: string;
  atFaultPartyInsurer?: string;
};

const statusOptions = ['New Matter', 'Customer Contacted', 'Awaiting Approval', 'Bike Delivered', 'Bike Returned', 'Demands Sent', 'Awaiting Settlement', 'Settlement Agreed', 'Paid', 'Closed'];

const initialCases = [
  { caseNumber: "2025-001", clientName: "John Smith", status: "Bike Delivered", lastUpdated: "2 hours ago", atFaultPartyName: "Jane Doe", clientInsuranceCompany: "AllState", atFaultPartyInsuranceCompany: "Geico", clientPhone: "555-1111", clientEmail:"john.s@example.com", clientStreetAddress: "123 Main St", clientSuburb: "Anytown", clientState: "NSW", clientPostcode: "2000", clientClaimNumber: "C001", clientInsurer: "", atFaultPartyPhone: "555-2222", atFaultPartyEmail: "jane.d@example.com", atFaultPartyStreetAddress: "456 Oak Ave", atFaultPartySuburb: "Otherville", atFaultPartyState: "NSW", atFaultPartyPostcode: "2001", atFaultPartyClaimNumber: "AF001", atFaultPartyInsurer: "", invoiced: 5500, reserve: 5000, agreed: 5000, paid: 2500, rentalCompany: "PBikeRescue Rentals", lawyer: "Smith & Co Lawyers", clientVehicleRego: "ABC123", atFaultPartyVehicleRego: "XYZ789" },
  { caseNumber: "2025-002", clientName: "Emma Thompson", status: "Settlement Agreed", lastUpdated: "1 day ago", atFaultPartyName: "Tom Wilson", clientInsuranceCompany: "Geico", atFaultPartyInsuranceCompany: "Progressive", clientPhone: "555-3333", clientEmail:"emma.t@example.com", clientStreetAddress: "789 Pine Ln", clientSuburb: "Someplace", clientState: "VIC", clientPostcode: "3000", clientClaimNumber: "C002", clientInsurer: "", atFaultPartyPhone: "555-4444", atFaultPartyEmail: "tom.w@example.com", atFaultPartyStreetAddress: "101 Maple Dr", atFaultPartySuburb: "Anywhere", atFaultPartyState: "VIC", atFaultPartyPostcode: "3001", atFaultPartyClaimNumber: "AF002", atFaultPartyInsurer: "", invoiced: 7200, reserve: 7000, agreed: 7000, paid: 7000, rentalCompany: "PBikeRescue Rentals", lawyer: "Smith & Co Lawyers", clientVehicleRego: "DEF456", atFaultPartyVehicleRego: "PQR123" },
  { caseNumber: "2024-135", clientName: "Michael Chen", status: "Awaiting Settlement", lastUpdated: "3 days ago", atFaultPartyName: "Susan White", clientInsuranceCompany: "Progressive", atFaultPartyInsuranceCompany: "AllState", clientPhone: "555-5555", clientEmail:"michael.c@example.com", atFaultPartyPhone: "555-6666", atFaultPartyEmail: "susan.w@example.com", clientStreetAddress: "210 Birch Rd", clientSuburb: "Thistown", clientState: "QLD", clientPostcode: "4000", clientClaimNumber: "C003", clientInsurer: "", atFaultPartyStreetAddress: "313 Cedar Ct", atFaultPartySuburb: "Thatville", atFaultPartyState: "QLD", atFaultPartyPostcode: "4001", atFaultPartyClaimNumber: "AF003", atFaultPartyInsurer: "", invoiced: 10000, reserve: 9500, agreed: 9000, paid: 0, rentalCompany: "City Wide Rentals", lawyer: "Davis Legal", clientVehicleRego: "GHI789", atFaultPartyVehicleRego: "STU456" },
  { caseNumber: "2025-003", clientName: "Olivia Wilson", status: "Paid", lastUpdated: "5 days ago", atFaultPartyName: "Robert Brown", clientInsuranceCompany: "State Farm", atFaultPartyInsuranceCompany: "Liberty Mutual", clientPhone: "555-7777", clientEmail:"olivia.w@example.com", atFaultPartyPhone: "555-8888", atFaultPartyEmail: "robert.b@example.com", clientStreetAddress: "555 Walnut Blvd", clientSuburb: "Newplace", clientState: "WA", clientPostcode: "6000", clientClaimNumber: "C004", clientInsurer: "", atFaultPartyStreetAddress: "777 Elm St", atFaultPartySuburb: "Oldplace", atFaultPartyState: "WA", atFaultPartyPostcode: "6001", atFaultPartyClaimNumber: "AF004", atFaultPartyInsurer: "", invoiced: 3000, reserve: 3000, agreed: 3000, paid: 3000, rentalCompany: "City Wide Rentals", lawyer: "Davis Legal", clientVehicleRego: "JKL012", atFaultPartyVehicleRego: "VWX789" },
  { caseNumber: "CASE-309002", clientName: "Sarah Johnson", status: "Demands Sent", lastUpdated: "1 hour ago", atFaultPartyName: "Mike Davis", clientInsuranceCompany: "NRMA", atFaultPartyInsuranceCompany: "AAMI", clientPhone: "0412345678", clientEmail:"sarah.johnson@email.com", atFaultPartyPhone: "0498765432", atFaultPartyEmail: "mike.davis@email.com", clientStreetAddress: "42 Collins Street", clientSuburb: "Melbourne", clientState: "VIC", clientPostcode: "3000", clientClaimNumber: "NRMA001", clientInsurer: "", atFaultPartyStreetAddress: "15 George Street", atFaultPartySuburb: "Sydney", atFaultPartyState: "NSW", atFaultPartyPostcode: "2000", atFaultPartyClaimNumber: "AAMI001", atFaultPartyInsurer: "", invoiced: 8500, reserve: 8000, agreed: 0, paid: 0, rentalCompany: "Metro Bike Rentals", lawyer: "Johnson Legal", accidentDate: "2025-01-15", accidentTime: "14:30", accidentDescription: "Rear-end collision at traffic lights on Collins Street", clientVehicleRego: "MNO345", atFaultPartyVehicleRego: "YZA012" },
];



export default function CasesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: cases, loading: casesLoading, error: casesError, create: createCase } = useCases();
  const { data: workspaces, loading: workspacesLoading } = useWorkspaces();
  const { data: contacts, loading: contactsLoading } = useContacts();
  const [hydratedCases, setHydratedCases] = useState<Case[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useSessionStorage<any>('activeWorkspace', null);
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());
  const [currentUser] = useSessionStorage<any>("currentUser", null);

  // Sorting state
  const [sortField, setSortField] = useState<'caseNumber' | 'clientName' | 'lastUpdated' | 'status'>('lastUpdated');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isClient, setIsClient] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingMock, setIsCreatingMock] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && cases) {
      setHydratedCases(cases as Case[]);
    }
  }, [isClient, cases]);
  
  const toggleRow = (caseNumber: string) => {
    setOpenRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(caseNumber)) {
        newSet.delete(caseNumber);
      } else {
        newSet.add(caseNumber);
      }
      return newSet;
    });
  };

  const handleAddCase = async (data: Omit<CaseFormValues, 'caseNumber'> & { workspaceId?: string }) => {
    try {
      const newCaseData = {
        ...data,
        caseNumber: `CASE-${Date.now().toString().slice(-6)}`,
        status: 'New Matter' as const,
        lastUpdated: 'Just now',
        invoiced: 0,
        reserve: 0,
        agreed: 0,
        paid: 0,
        workspaceId: activeWorkspace?.name === 'Main Workspace' ? undefined : activeWorkspace?.id,
      };
      await createCase(newCaseData);
    } catch (error) {
      console.error('Error creating case:', error);
    }
  };
  
  const handleStatusChange = (caseNumber: string, newStatus: Case['status']) => {
    // TODO: Implement case update functionality
    console.log('Status change requested:', caseNumber, newStatus);
  }

  const handleDeleteCase = async (caseId: string, caseNumber: string) => {
    if (!confirm(`Are you sure you want to delete case ${caseNumber}? This will also delete all associated documents and cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/cases/${caseId}/delete`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Case deleted:', result);
        // Refresh the cases list
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to delete case: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting case:', error);
      alert('Failed to delete case. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };


  const handleCreateMockCases = async () => {
    if (!confirm('This will create 5 mock cases with sample data. Continue?')) {
      return;
    }

    setIsCreatingMock(true);
    try {
      const response = await fetch('/api/cases/create-mock', {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Mock cases created:', result);
        alert(`Successfully created ${result.createdCount} mock cases`);
        // Refresh the page
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to create mock cases: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating mock cases:', error);
      alert('Failed to create mock cases. Please try again.');
    } finally {
      setIsCreatingMock(false);
    }
  };

  const clearWorkspaceFilter = () => {
    setActiveWorkspace(null);
  };

  const handleWorkspaceAssignment = (caseNumber: string, workspaceId: string) => {
    setHydratedCases(prevCases =>
      prevCases.map(c =>
        c.caseNumber === caseNumber
          ? { ...c, workspaceId: workspaceId === 'none' ? undefined : workspaceId, lastUpdated: 'Just now' }
          : c
      )
    );
  };

  const handleLawyerAssignment = (caseNumber: string, lawyerId: string) => {
    setHydratedCases(prevCases =>
      prevCases.map(c =>
        c.caseNumber === caseNumber
          ? { ...c, assigned_lawyer_id: lawyerId === 'none' ? undefined : lawyerId, lastUpdated: 'Just now' }
          : c
      )
    );
  };

  const handleRentalCompanyAssignment = (caseNumber: string, rentalCompanyId: string) => {
    setHydratedCases(prevCases =>
      prevCases.map(c =>
        c.caseNumber === caseNumber
          ? { ...c, assigned_rental_company_id: rentalCompanyId === 'none' ? undefined : rentalCompanyId, lastUpdated: 'Just now' }
          : c
      )
    );
  };

  // Get filtered contacts for dropdowns
  const getLawyerContacts = () => (contacts as Contact[]).filter(c => c.type === 'Lawyer');
  const getRentalCompanyContacts = () => (contacts as Contact[]).filter(c => c.type === 'Rental Company');

  // Get contact name by ID
  const getContactName = (contactId?: string) => {
    if (!contactId) return '';
    const contact = (contacts as Contact[]).find(c => c.id === contactId);
    return contact?.name || '';
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: typeof sortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-4 w-4 text-blue-600" />
      : <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  // Search filtering function
  const searchFilter = useMemo(() => {
    if (!searchQuery.trim()) return () => true;
    
    const query = searchQuery.toLowerCase().trim();
    
    return (c: Case) => {
      // Search in case number
      if (c.caseNumber?.toLowerCase().includes(query)) return true;
      
      // Search in not-at-fault client (NAF) details
      if (c.clientName?.toLowerCase().includes(query)) return true;
      if (c.clientPhone?.toLowerCase().includes(query)) return true;
      if (c.clientEmail?.toLowerCase().includes(query)) return true;
      if (c.clientSuburb?.toLowerCase().includes(query)) return true;
      if (c.clientPostcode?.toLowerCase().includes(query)) return true;
      if (c.clientClaimNumber?.toLowerCase().includes(query)) return true;
      if (c.clientVehicleRego?.toLowerCase().includes(query)) return true;
      
      // Search in at-fault party details
      if (c.atFaultPartyName?.toLowerCase().includes(query)) return true;
      if (c.atFaultPartyPhone?.toLowerCase().includes(query)) return true;
      if (c.atFaultPartyEmail?.toLowerCase().includes(query)) return true;
      if (c.atFaultPartySuburb?.toLowerCase().includes(query)) return true;
      if (c.atFaultPartyPostcode?.toLowerCase().includes(query)) return true;
      if (c.atFaultPartyClaimNumber?.toLowerCase().includes(query)) return true;
      if (c.atFaultPartyVehicleRego?.toLowerCase().includes(query)) return true;
      
      return false;
    };
  }, [searchQuery]);
  
  const filteredAndSortedCases = hydratedCases
    .filter(c => {
      // First apply workspace/user visibility rules
      let visibilityPassed = false;
      
      // If workspace user, implement strict visibility rules
      if (currentUser?.role === 'workspace_user') {
        const userContactId = currentUser.contactId;
        if (!userContactId) return false;
        
        // Check if case is assigned to this user's contact (either as lawyer or rental company)
        visibilityPassed = c.assigned_lawyer_id === userContactId || c.assigned_rental_company_id === userContactId;
      } else {
        // For admin/developer users, show all cases or filtered by workspace
        if (activeWorkspace) {
          // Check if this is the Main Workspace (special case: shows ALL cases)
          if (activeWorkspace.name === 'Main Workspace') {
            visibilityPassed = true; // Main Workspace shows ALL cases
          } else {
            // Regular workspace: show only cases assigned to this workspace
            visibilityPassed = c.workspaceId === activeWorkspace.id;
          }
        } else {
          // No workspace selected: show only cases NOT assigned to any workspace
          visibilityPassed = !c.workspaceId;
        }
      }
      
      // If visibility check fails, exclude the case
      if (!visibilityPassed) return false;
      
      // Apply search filter
      return searchFilter(c);
    })
    .sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'caseNumber':
          aValue = a.caseNumber;
          bValue = b.caseNumber;
          break;
        case 'clientName':
          aValue = a.clientName;
          bValue = b.clientName;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'lastUpdated':
        default:
          // Convert relative time to sortable format
          const timeToMinutes = (time: string) => {
            if (!time) return 999999; // Handle undefined/null/empty time
            if (time.includes('Just now')) return 0;
            if (time.includes('hour')) return parseInt(time) * 60;
            if (time.includes('day')) return parseInt(time) * 24 * 60;
            if (time.includes('week')) return parseInt(time) * 7 * 24 * 60;
            return 999999; // Very old
          };
          aValue = timeToMinutes(a.lastUpdated);
          bValue = timeToMinutes(b.lastUpdated);
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      } else {
        const comparison = (aValue as number) - (bValue as number);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
    });

  // Calculate search results count
  const searchResultsCount = useMemo(() => {
    return filteredAndSortedCases.length;
  }, [filteredAndSortedCases]);
  
  if (!isClient || casesLoading || workspacesLoading || contactsLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading cases...</div>;
  }

  if (casesError) {
    return <div className="flex items-center justify-center h-64 text-destructive">Error loading cases. Please refresh the page.</div>;
  }
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Case List</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCreateMockCases}
            disabled={isCreatingMock}
          >
            {isCreatingMock ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Database className="mr-2 h-4 w-4" />
            )}
            Create Mock Cases
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> New Case
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl h-[90vh]">
            <DialogHeader>
              <DialogTitle>Create New Case</DialogTitle>
              <DialogDescription>
                Enter case details for both parties.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-full pr-6">
              <NewCaseForm onCaseCreate={handleAddCase} setDialogOpen={setIsDialogOpen} activeWorkspaceId={activeWorkspace?.id} />
            </ScrollArea>
          </DialogContent>
        </Dialog>
        </div>
      </div>
      
      {/* Search Field */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search cases by number, client, at-fault party, rego, claim number, suburb, postcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
            {searchResultsCount} result{searchResultsCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
           <div className="flex flex-wrap items-center justify-between gap-y-4">
              <div className="flex-1 min-w-[250px]">
                  {activeWorkspace ? (
                    <>
                      <CardTitle>Workspace: {activeWorkspace.name}</CardTitle>
                      <CardDescription>
                        {activeWorkspace.name === 'Main Workspace' 
                          ? 'Showing all cases across all workspaces and unassigned cases'
                          : `Showing cases filtered by ${activeWorkspace.type}: ${activeWorkspace.name}`
                        }
                      </CardDescription>
                    </>
                  ) : (
                    <>
                      <CardTitle>All Cases</CardTitle>
                      <CardDescription>Here you can view, edit, and manage all rental cases.</CardDescription>
                    </>
                  )}
              </div>
              <div className="text-sm text-muted-foreground">
                Sorted by {sortField.replace(/([A-Z])/g, ' $1').toLowerCase()} ({sortDirection === 'asc' ? 'ascending' : 'descending'})
              </div>
          </div>
        </CardHeader>
        
        <div className="px-6 pb-4 border-b">
            {activeWorkspace && currentUser?.role !== 'workspace_user' ? (
                <Button variant="outline" size="sm" onClick={clearWorkspaceFilter}>
                    <FilterX className="mr-2 h-4 w-4" />
                    Clear Workspace Filter
                </Button>
            ) : activeWorkspace && currentUser?.role === 'workspace_user' ? (
                <p className="text-sm text-muted-foreground">Viewing your assigned cases only.</p>
            ) : (
                <p className="text-sm text-muted-foreground">Go to Workspaces page to apply a saved filter.</p>
            )}
        </div>
        
        <CardContent className="pt-4">
          <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium hover:bg-transparent flex items-center gap-1"
                            onClick={() => handleSort('caseNumber')}
                          >
                            Case Number
                            {getSortIcon('caseNumber')}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium hover:bg-transparent flex items-center gap-1"
                            onClick={() => handleSort('clientName')}
                          >
                            Client
                            {getSortIcon('clientName')}
                          </Button>
                        </TableHead>
                        <TableHead>Assigned Lawyer</TableHead>
                        <TableHead>Assigned Rental Company</TableHead>
                        <TableHead>At-Fault Insurer</TableHead>
                        <TableHead>Workspace</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium hover:bg-transparent flex items-center gap-1"
                            onClick={() => handleSort('status')}
                          >
                            Status
                            {getSortIcon('status')}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium hover:bg-transparent flex items-center gap-1"
                            onClick={() => handleSort('lastUpdated')}
                          >
                            Last Updated
                            {getSortIcon('lastUpdated')}
                          </Button>
                        </TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {filteredAndSortedCases.map((c) => {
                  const isOpen = openRows.has(c.caseNumber);
                  return (
                    <React.Fragment key={c.caseNumber}>
                      <TableRow>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="w-9 p-0" onClick={() => toggleRow(c.caseNumber)}>
                              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              <span className="sr-only">Toggle</span>
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">{c.caseNumber}</TableCell>
                          <TableCell>{c.clientName}</TableCell>
                          <TableCell>
                            <Select
                              value={c.assigned_lawyer_id || "none"}
                              onValueChange={(lawyerId) => handleLawyerAssignment(c.caseNumber, lawyerId)}
                              disabled={currentUser?.role === 'workspace_user' && currentUser.contactId !== c.assigned_lawyer_id}
                            >
                              <SelectTrigger className="h-8 w-[140px] text-xs">
                                <SelectValue placeholder="No lawyer" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No lawyer</SelectItem>
                                {(currentUser?.role === 'workspace_user' ?
                                  getLawyerContacts().filter((lawyer: Contact) => lawyer.id === currentUser.contactId) :
                                  getLawyerContacts()
                                ).map((lawyer: Contact) => (
                                  <SelectItem key={lawyer.id} value={lawyer.id}>
                                    {lawyer.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={c.assigned_rental_company_id || "none"}
                              onValueChange={(rentalCompanyId) => handleRentalCompanyAssignment(c.caseNumber, rentalCompanyId)}
                              disabled={currentUser?.role === 'workspace_user' && currentUser.contactId !== c.assigned_rental_company_id}
                            >
                              <SelectTrigger className="h-8 w-[140px] text-xs">
                                <SelectValue placeholder="No rental company" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No rental company</SelectItem>
                                {(currentUser?.role === 'workspace_user' ?
                                  getRentalCompanyContacts().filter((company: Contact) => company.id === currentUser.contactId) :
                                  getRentalCompanyContacts()
                                ).map((company: Contact) => (
                                  <SelectItem key={company.id} value={company.id}>
                                    {company.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{c.atFaultPartyInsuranceCompany}</TableCell>
                          <TableCell>
                            <Select
                              value={c.workspaceId || "none"}
                              onValueChange={(workspaceId) => handleWorkspaceAssignment(c.caseNumber, workspaceId)}
                            >
                              <SelectTrigger className="h-8 w-[140px] text-xs">
                                <SelectValue placeholder="No workspace" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No workspace</SelectItem>
                                {(workspaces as Workspace[]).map((workspace: Workspace) => {
                                  const contact = (contacts as Contact[]).find(c => c.id === workspace.contactId);
                                  return (
                                    <SelectItem key={workspace.id} value={workspace.id}>
                                      {contact?.name || workspace.name}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select value={c.status} onValueChange={(newStatus) => handleStatusChange(c.caseNumber, newStatus as Case['status'])}>
                                <SelectTrigger className="h-8 w-[120px] text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{c.lastUpdated}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => router.push(`/cases/${c.id}`)}>
                                View Details
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteCase(c.id!, c.caseNumber)}
                                disabled={isDeleting}
                              >
                                {isDeleting ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow>
                          <TableCell colSpan={10} className="p-0">
                             <div className="p-4 bg-muted/50">
                              <CommunicationLog caseNumber={c.caseNumber} />
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    