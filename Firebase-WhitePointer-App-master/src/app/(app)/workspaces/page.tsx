
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStorage } from "@/hooks/use-session-storage";
import { useWorkspaces, useContacts } from "@/hooks/use-database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Building, PlusCircle, MoreVertical, Edit, Trash2 } from "lucide-react";
import type { WorkspaceFrontend as Workspace, ContactFrontend as Contact } from "@/lib/database-schema";
import { NewWorkspaceForm } from "./new-workspace-form";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const workspaceCategories: Contact['type'][] = ['Insurer', 'Lawyer', 'Rental Company'];

export default function WorkspacesPage() {
  const { data: workspaces, loading: workspacesLoading, error: workspacesError, create: createWorkspace, update: updateWorkspace, remove: deleteWorkspace } = useWorkspaces();
  const { data: contacts, loading: contactsLoading, error: contactsError } = useContacts();
  const [_, setActiveWorkspace] = useSessionStorage<{id: string, name: string, type: string} | null>('activeWorkspace', null);
  
  const [isClient, setIsClient] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState<Workspace | null>(null);
  const [activeTab, setActiveTab] = useState<Contact['type']>('Rental Company');

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFormSubmit = async (workspaceData: Omit<Workspace, 'id'> & { id?: string }) => {
    try {
      if (workspaceData.id) { // Edit mode
        const { id, ...data } = workspaceData;
        await updateWorkspace(id, data);
        toast({ title: "Workspace Updated", description: `"${workspaceData.name}" has been updated.` });
      } else { // Create mode
        await createWorkspace(workspaceData);
        toast({ title: "Workspace Created", description: `New workspace "${workspaceData.name}" has been created.` });
      }
      setIsFormOpen(false);
      setWorkspaceToEdit(null);
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to save workspace" 
      });
    }
  };
  
  const handleSelectWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find(ws => ws.id === workspaceId);
    if (!workspace) return;

    const contact = contacts.find(c => c.id === workspace.contactId);
    if (!contact) {
        toast({ variant: "destructive", title: "Contact Not Found", description: "The contact assigned to this workspace no longer exists." });
        return;
    }

    setActiveWorkspace({
        id: workspace.id,
        name: contact.name,
        type: contact.type,
    });
    
    toast({ title: "Workspace Activated", description: `Viewing cases for ${contact.name}.`});
    router.push('/cases');
  }
  
  const handleDeleteWorkspace = async (workspaceId: string) => {
    try {
      await deleteWorkspace(workspaceId);
      toast({ variant: "destructive", title: "Workspace Deleted" });
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to delete workspace" 
      });
    }
  }

  const getWorkspacesForCategory = (category: Contact['type']) => {
    const contactIdsForCategory = contacts.filter(c => c.type === category).map(c => c.id);
    return workspaces.filter(ws => contactIdsForCategory.includes(ws.contactId));
  }

  const getContactForWorkspace = (workspace: Workspace) => {
    return contacts.find(c => c.id === workspace.contactId);
  }
  
  const openNewForm = () => {
    setWorkspaceToEdit(null);
    setIsFormOpen(true);
  }
  
  const openEditForm = (workspace: Workspace) => {
    setWorkspaceToEdit(workspace);
    setIsFormOpen(true);
  }

  if (!isClient || workspacesLoading || contactsLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  }

  if (workspacesError || contactsError) {
    return <div className="flex items-center justify-center h-64 text-destructive">Error loading data. Please refresh the page.</div>;
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <div>
                 <h1 className="text-2xl font-bold">Workspaces</h1>
                 <p className="text-muted-foreground">Workspaces act as saved filters for your cases.</p>
            </div>
          <Button onClick={openNewForm}>
            <PlusCircle className="mr-2 h-4 w-4" /> New Workspace
          </Button>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Select a Workspace Filter</CardTitle>
                <CardDescription>
                Click on a workspace to view all cases associated with that company or lawyer, or select Main Workspace to view all cases.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Main Workspace - Special Section */}
                {workspaces.find(ws => ws.name === 'Main Workspace') && (
                  <div className="mb-6 p-4 border rounded-lg bg-primary/5">
                    <h3 className="text-lg font-semibold mb-2">Main Workspace</h3>
                    <p className="text-sm text-muted-foreground mb-3">View all cases across all workspaces and unassigned cases</p>
                    <Card 
                      className="cursor-pointer transition-all hover:shadow-lg border-primary/20 hover:border-primary/50"
                      onClick={() => handleSelectWorkspace(workspaces.find(ws => ws.name === 'Main Workspace')!.id)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                          <Building /> Main Workspace
                        </CardTitle>
                        <CardDescription>Shows all cases without filtering</CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                )}

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Contact['type'])} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="Insurer">Insurers</TabsTrigger>
                        <TabsTrigger value="Lawyer">Lawyers</TabsTrigger>
                        <TabsTrigger value="Rental Company">Rental Companies</TabsTrigger>
                    </TabsList>
                    
                    {workspaceCategories.map(category => (
                        <TabsContent key={category} value={category}>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                {getWorkspacesForCategory(category).map(ws => {
                                    const contact = getContactForWorkspace(ws);
                                    return (
                                        <Card 
                                            key={ws.id} 
                                            className={`flex flex-col transition-all hover:shadow-lg border-border`}
                                        >
                                            <div 
                                                className="flex-grow cursor-pointer"
                                                onClick={() => handleSelectWorkspace(ws.id)}
                                            >
                                                <CardHeader>
                                                    <CardTitle className="flex items-center gap-2"><Building /> {ws.name}</CardTitle>
                                                    <CardDescription>Contact: {contact?.name || "Unknown"}</CardDescription>
                                                </CardHeader>
                                            </div>
                                            <CardFooter className="p-2 border-t justify-end">
                                                <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => openEditForm(ws)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>This action cannot be undone. This will permanently delete the workspace.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteWorkspace(ws.id)}>Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                                </DropdownMenu>
                                            </CardFooter>
                                        </Card>
                                    )
                                })}
                            </div>
                            {getWorkspacesForCategory(category).length === 0 && (
                                <div className="text-center py-10 text-muted-foreground">
                                    <p>No workspaces found for this category.</p>
                                </div>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
      </div>

       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{workspaceToEdit ? "Edit Workspace" : "Create New Workspace"}</DialogTitle>
                    <DialogDescription>
                        {workspaceToEdit ? "Update the details for your workspace." : "Workspaces help you organize different parts of your business."}
                    </DialogDescription>
                </DialogHeader>
                <NewWorkspaceForm 
                    contacts={contacts} 
                    onSubmit={handleFormSubmit}
                    setDialogOpen={setIsFormOpen}
                    workspaceToEdit={workspaceToEdit}
                    activeCategory={activeTab}
                />
            </DialogContent>
        </Dialog>
    </>
  );
}
