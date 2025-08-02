
"use client";

import { useState } from "react";
import { UserPlus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ContactFrontend as Contact } from "@/lib/database-schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddContactForm } from "../contacts/add-contact-form";

interface ContactPickerProps {
  contacts: Contact[];
  value: string;
  onChange: (value: string) => void;
  onSelectContact: (contact: Contact) => void;
  onAddContact: (contact: Omit<Contact, 'id'>) => Contact;
  contactType: Contact['type'];
}

export function ContactPicker({
  contacts,
  value,
  onChange,
  onSelectContact,
  onAddContact,
  contactType
}: ContactPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddContactOpen, setAddContactOpen] = useState(false);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (contact: Contact) => {
    onSelectContact(contact);
    setOpen(false);
  };
  
  const handleAddNewContact = (newContactData: Omit<Contact, 'id'>) => {
    const newContact = onAddContact(newContactData);
    onSelectContact(newContact);
    setAddContactOpen(false);
    setOpen(false);
  }

  return (
    <>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${contactType} name...`}
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="icon">
              <Users className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Select {contactType}</DialogTitle>
              <DialogDescription>Choose an existing contact or add a new one.</DialogDescription>
            </DialogHeader>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <ScrollArea className="h-64">
              <div className="p-1">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map(contact => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => handleSelect(contact)}
                      className="w-full text-left p-2 rounded-md hover:bg-accent"
                    >
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.email}</p>
                    </button>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-4">No contacts found.</p>
                )}
              </div>
            </ScrollArea>
             <DialogFooter className="sm:justify-between">
                <Dialog open={isAddContactOpen} onOpenChange={setAddContactOpen}>
                    <DialogTrigger asChild>
                        <Button type="button" variant="ghost">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add New Contact
                        </Button>
                    </DialogTrigger>
                     <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New {contactType}</DialogTitle>
                            <DialogDescription>
                              Add a new contact to your address book
                            </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                          <AddContactForm 
                            onAddContact={handleAddNewContact}
                            setDialogOpen={setAddContactOpen}
                            activeTab={contactType}
                          />
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Close</Button>
                </DialogClose>
             </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
