
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays, parseISO } from "date-fns";
import type { Commitment } from "@/types/commitment";
import type { CaseFrontend as Case } from "@/lib/database-schema";
import { CheckCircle, Clock, PlusCircle, Edit, FolderOpen, FolderClosed, ClipboardCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { NewCommitmentForm } from "./new-commitment-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function CommitmentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [commitments, setCommitments] = useLocalStorage<Commitment[]>("commitments", []);
  const [cases, setCases] = useState<Case[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [commitmentToEdit, setCommitmentToEdit] = useState<Commitment | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load case data. Some information may be missing.',
        });
      } finally {
        setCasesLoading(false);
      }
    };

    fetchCases();
  }, [toast]);

  const getCommitmentsWithCaseData = (status: 'Open' | 'Closed') => {
      return commitments
        .filter(c => c.status === status)
        .map(c => ({ ...c, caseData: cases.find(cs => cs.caseNumber === c.caseNumber) }))
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  const openCommitments = getCommitmentsWithCaseData('Open');
  const closedCommitments = getCommitmentsWithCaseData('Closed');

  const handleToggleCommitment = (id: string, currentStatus: 'Open' | 'Closed') => {
    const newStatus = currentStatus === 'Open' ? 'Closed' : 'Open';
    setCommitments(
      commitments.map(c => c.id === id ? { ...c, status: newStatus } : c)
    );
    toast({ title: `Commitment ${newStatus}` });
  };
  
  const openNewForm = () => {
    setCommitmentToEdit(null);
    setIsFormOpen(true);
  };
  
  const openEditForm = (commitment: Commitment) => {
    setCommitmentToEdit(commitment);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: Omit<Commitment, 'id' | 'status'> & { id?: string }) => {
    if (data.id) { // Editing existing commitment
      setCommitments(prev => prev.map(c => c.id === data.id ? { ...c, ...data, dueDate: data.dueDate } as Commitment : c));
      toast({ title: "Commitment Updated" });
    } else { // Creating new commitment
      const newCommitment: Commitment = {
        id: `com-${Date.now()}`,
        status: 'Open',
        ...data,
      };
      setCommitments(prev => [newCommitment, ...prev]);
      toast({ title: "Commitment Created" });
    }
    setIsFormOpen(false);
    setCommitmentToEdit(null);
  };

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = parseISO(dueDate);
    return differenceInDays(due, today);
  };
  
  const CommitmentTable = ({ data }: { data: (Commitment & {caseData?: Case})[] }) => (
     <div className="rounded-md border">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Case Number</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Days Remaining</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Actions</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {data.length > 0 ? data.map(c => {
                const daysRemaining = getDaysRemaining(c.dueDate);
                return (
                <TableRow key={c.id}>
                    <TableCell>
                        <ClipboardCheck className={cn("h-5 w-5", daysRemaining < 0 ? "text-destructive" : "text-green-600")} />
                    </TableCell>
                    <TableCell 
                        className="font-medium hover:underline cursor-pointer"
                        onClick={() => router.push(`/cases/${c.caseNumber}`)}
                    >
                        {c.caseNumber}
                    </TableCell>
                    <TableCell>{c.caseData?.clientName || "N/A"}</TableCell>
                    <TableCell>{format(parseISO(c.dueDate), 'PPP')}</TableCell>
                    <TableCell>
                      <Badge variant={daysRemaining < 0 ? 'destructive' : 'default'}>
                        {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days`}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">{c.note}</TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditForm(c)}
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleToggleCommitment(c.id, c.status)}
                        >
                            {c.status === 'Open' ? <CheckCircle className="mr-2 h-4 w-4" /> : <FolderOpen className="mr-2 h-4 w-4" />}
                            {c.status === 'Open' ? 'Close' : 'Re-open'}
                        </Button>
                    </TableCell>
                </TableRow>
                )
            }) : (
                <TableRow>
                <TableCell colSpan={7} className="text-center h-24">No commitments found.</TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
    </div>
  )

  return (
    <>
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Commitments</h1>
        <Button onClick={openNewForm}>
          <PlusCircle className="mr-2 h-4 w-4" /> New Commitment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commitment List</CardTitle>
          <CardDescription>
            All follow-ups and deadlines across all cases.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isClient && !casesLoading ? (
            <Tabs defaultValue="open">
                <TabsList className="mb-4">
                    <TabsTrigger value="open"><FolderOpen className="mr-2 h-4 w-4" /> Open ({openCommitments.length})</TabsTrigger>
                    <TabsTrigger value="closed"><FolderClosed className="mr-2 h-4 w-4" /> Closed ({closedCommitments.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="open">
                    <CommitmentTable data={openCommitments} />
                </TabsContent>
                <TabsContent value="closed">
                    <CommitmentTable data={closedCommitments} />
                </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4">
              <div className="flex space-x-2">
                <div className="h-10 w-32 rounded-md bg-muted animate-pulse" />
                <div className="h-10 w-32 rounded-md bg-muted animate-pulse" />
              </div>
              <div className="h-64 rounded-md border bg-muted animate-pulse" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    
     <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{commitmentToEdit ? 'Edit' : 'Create New'} Commitment</DialogTitle>
                <DialogDescription>
                    {commitmentToEdit ? 'Update the details for this commitment.' : 'Create a new follow-up or deadline.'}
                </DialogDescription>
            </DialogHeader>
            <NewCommitmentForm 
                cases={cases}
                commitmentToEdit={commitmentToEdit}
                onSubmit={handleFormSubmit}
                setDialogOpen={setIsFormOpen}
            />
        </DialogContent>
     </Dialog>
    </>
  );
}
