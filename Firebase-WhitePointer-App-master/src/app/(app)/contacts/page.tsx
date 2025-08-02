"use client";

import { useState, useEffect } from "react";
import type { ContactFrontend as Contact } from "@/lib/database-schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreVertical } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddContactForm } from "./add-contact-form";
import { useContacts } from "@/hooks/use-database";
import { useToast } from "@/hooks/use-toast";

export default function ContactsPage() {
    const { toast } = useToast();
    const { data: contacts, loading: contactsLoading, error: contactsError, create: createContact } = useContacts();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<Contact['type']>('Insurer');

    const contactTypes: Contact['type'][] = ['Client', 'Lawyer', 'Insurer', 'Repairer', 'Rental Company', 'Service Center', 'Other'];

    const handleAddContact = async (contact: Omit<Contact, 'id'>) => {
        console.log("Adding contact:", contact);
        try {
            await createContact(contact);
            console.log("Contact added successfully");
            setActiveTab(contact.type);
            setIsDialogOpen(false);
            toast({ title: "Contact Added", description: "Contact has been added successfully." });
        } catch (error) {
            console.error("Error in handleAddContact:", error);
            let errorMessage = "Failed to add contact";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            toast({ 
                variant: "destructive", 
                title: "Error", 
                description: errorMessage 
            });
        }
    }
    
    if (contactsLoading) {
        return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading contacts...</div>;
    }

    if (contactsError) {
        return <div className="flex items-center justify-center h-64 text-destructive">Error loading contacts. Please refresh the page.</div>;
    }
    
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Contacts</h1>
                 <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" /> Add Contact</Button></DialogTrigger>
                    <DialogContent className="max-h-[80vh] overflow-auto">
                        <DialogHeader className="sticky top-0 bg-background z-10">
                            <DialogTitle>Add New Contact</DialogTitle>
                            <DialogDescription>Add a new business or service provider to your contacts.</DialogDescription>
                        </DialogHeader>
                        <div className="p-1">
                            <AddContactForm 
                                onAddContact={handleAddContact} 
                                setDialogOpen={setIsDialogOpen}
                                activeTab={activeTab} 
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Address Book</CardTitle>
                    <CardDescription>Manage all external contacts and service providers.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Contact['type'])} className="w-full">
                        <TabsList className="flex-wrap h-auto">
                            {contactTypes.map(type => (
                                <TabsTrigger key={type} value={type}>{type.endsWith('s') ? type : `${type}s`}</TabsTrigger>
                            ))}
                        </TabsList>
                        {contactTypes.map(type => (
                            <TabsContent key={type} value={type}>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Company</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Phone</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead><span className="sr-only">Actions</span></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {contacts.filter(c => c.type === type).length > 0 ? (
                                                contacts.filter(c => c.type === type).map(contact => (
                                                    <TableRow key={contact.id}>
                                                        <TableCell className="font-medium">{contact.company}</TableCell>
                                                        <TableCell className="font-medium">{contact.name}</TableCell>
                                                        <TableCell>{contact.phone}</TableCell>
                                                        <TableCell>{contact.email}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-24 text-center">
                                                        No contacts found for this category.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
