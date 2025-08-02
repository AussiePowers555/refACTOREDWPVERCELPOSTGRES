
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, User, ShieldAlert, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { CaseFrontend as Case } from '@/lib/database-schema';
import type { ContactFrontend as Contact } from "@/lib/database-schema"
import { ContactPicker } from "./contact-picker"
import { useLocalStorage } from "@/hooks/use-local-storage"

const formSchema = z.object({
  caseNumber: z.string().optional(),
  rentalCompany: z.string().min(1, "Rental Company is required."),
  lawyer: z.string().optional(),
  
  // Client fields
  clientName: z.string().min(1, "Client name is required."),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email("Invalid email address.").optional().or(z.literal('')),
  clientStreetAddress: z.string().optional(),
  clientSuburb: z.string().optional(),
  clientState: z.string().optional(),
  clientPostcode: z.string().optional(),
  clientClaimNumber: z.string().optional(),
  clientInsuranceCompany: z.string().optional(),
  clientInsurer: z.string().optional(),

  // At-Fault party fields
  atFaultPartyName: z.string().min(1, "At-fault party name is required."),
  atFaultPartyPhone: z.string().optional(),
  atFaultPartyEmail: z.string().email("Invalid email address.").optional().or(z.literal('')),
  atFaultPartyStreetAddress: z.string().optional(),
  atFaultPartySuburb: z.string().optional(),
  atFaultPartyState: z.string().optional(),
  atFaultPartyPostcode: z.string().optional(),
  atFaultPartyClaimNumber: z.string().optional(),
  atFaultPartyInsuranceCompany: z.string().optional(),
  atFaultPartyInsurer: z.string().optional(),
})

type CaseFormValues = z.infer<typeof formSchema>;


interface NewCaseFormProps {
  onCaseCreate: (data: Omit<CaseFormValues, 'caseNumber'> & { workspaceId?: string }) => void;
  setDialogOpen: (open: boolean) => void;
  activeWorkspaceId?: string;
}

const stateOptions = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
const insuranceCompanyOptions = ["AllState", "Geico", "Progressive", "State Farm", "Liberty Mutual", "Other"];
const rentalCompanyOptions = ["PBikeRescue Rentals", "City Wide Rentals", "Partner Rentals Inc."];


export function NewCaseForm({ onCaseCreate, setDialogOpen, activeWorkspaceId }: NewCaseFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [contacts, setContacts] = useLocalStorage<Contact[]>("contacts", []);


  const form = useForm<CaseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rentalCompany: "PBikeRescue Rentals",
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      clientStreetAddress: "",
      clientSuburb: "",
      clientState: "",
      clientPostcode: "",
      clientClaimNumber: "",
      clientInsuranceCompany: "",
      clientInsurer: "",
      atFaultPartyName: "",
      atFaultPartyPhone: "",
      atFaultPartyEmail: "",
      atFaultPartyStreetAddress: "",
      atFaultPartySuburb: "",
      atFaultPartyState: "",
      atFaultPartyPostcode: "",
      atFaultPartyClaimNumber: "",
      atFaultPartyInsuranceCompany: "",
      atFaultPartyInsurer: "",
    },
  })

  async function onSubmit(values: CaseFormValues) {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    onCaseCreate({ ...values, workspaceId: activeWorkspaceId });
    setIsLoading(false);
    setDialogOpen(false);
    toast({
      title: "Success",
      description: "New case has been created successfully.",
    });
  }

  const handleSelectContact = (contact: Contact, fieldName: keyof CaseFormValues) => {
    form.setValue(fieldName as any, contact.name);

    if (fieldName === 'clientName') {
      form.setValue('clientPhone', contact.phone || '');
      form.setValue('clientEmail', contact.email || '');
      form.setValue('clientStreetAddress', contact.address || '');
    } else if (fieldName === 'atFaultPartyName') {
      form.setValue('atFaultPartyPhone', contact.phone || '');
      form.setValue('atFaultPartyEmail', contact.email || '');
      form.setValue('atFaultPartyStreetAddress', contact.address || '');
    }
  };


  const handleAddContact = (contact: Omit<Contact, 'id'>) => {
    const newContact: Contact = {
      id: `cont-${Date.now()}`,
      ...contact,
    };
    setContacts(prev => [newContact, ...prev]);
    return newContact;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="rentalCompany"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Rental Company</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>{rentalCompanyOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField name="lawyer" render={({ field }) => (
                <FormItem>
                    <FormLabel>Assigned Lawyer</FormLabel>
                    <FormControl>
                        <ContactPicker
                        contacts={contacts.filter(c => c.type === 'Lawyer')}
                        value={field.value || ''}
                        onChange={field.onChange}
                        onSelectContact={(contact) => handleSelectContact(contact, 'lawyer')}
                        onAddContact={handleAddContact}
                        contactType="Lawyer"
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Column */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" /> Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField name="clientName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <ContactPicker
                      contacts={contacts.filter(c => c.type === 'Client')}
                      value={field.value}
                      onChange={field.onChange}
                      onSelectContact={(contact) => handleSelectContact(contact, 'clientName')}
                      onAddContact={handleAddContact}
                      contactType="Client"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField name="clientPhone" render={({ field }) => (
                  <FormItem><FormLabel>Client Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="clientEmail" render={({ field }) => (
                  <FormItem><FormLabel>Client Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField name="clientStreetAddress" render={({ field }) => (
                <FormItem><FormLabel>Client Street Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-3 gap-4">
                 <FormField name="clientSuburb" render={({ field }) => (
                  <FormItem><FormLabel>Suburb</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="clientState" render={({ field }) => (
                  <FormItem><FormLabel>State</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{stateOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField name="clientPostcode" render={({ field }) => (
                  <FormItem><FormLabel>Postcode</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField name="clientClaimNumber" render={({ field }) => (
                  <FormItem><FormLabel>Client Claim Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="clientInsuranceCompany" render={({ field }) => (
                  <FormItem><FormLabel>Client Insurance Company</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{insuranceCompanyOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
              )} />
               <FormField name="clientInsurer" render={({ field }) => (
                  <FormItem><FormLabel>Client Insurer (manual)</FormLabel><FormControl><Input placeholder="Or enter manually" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>
          
          {/* At-Fault Party Column */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldAlert className="h-5 w-5" /> At Fault (AF) Party
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <FormField name="atFaultPartyName" render={({ field }) => (
                <FormItem>
                  <FormLabel>AF Name</FormLabel>
                  <FormControl>
                     <ContactPicker
                        contacts={contacts.filter(c => c.type === 'Other')}
                        value={field.value}
                        onChange={field.onChange}
                        onSelectContact={(contact) => handleSelectContact(contact, 'atFaultPartyName')}
                        onAddContact={handleAddContact}
                        contactType="Other"
                      />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField name="atFaultPartyPhone" render={({ field }) => (
                  <FormItem><FormLabel>AF Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="atFaultPartyEmail" render={({ field }) => (
                  <FormItem><FormLabel>AF Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField name="atFaultPartyStreetAddress" render={({ field }) => (
                <FormItem><FormLabel>AF Street Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-3 gap-4">
                 <FormField name="atFaultPartySuburb" render={({ field }) => (
                  <FormItem><FormLabel>AF Suburb</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="atFaultPartyState" render={({ field }) => (
                  <FormItem><FormLabel>AF State</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{stateOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField name="atFaultPartyPostcode" render={({ field }) => (
                  <FormItem><FormLabel>AF Postcode</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField name="atFaultPartyClaimNumber" render={({ field }) => (
                  <FormItem><FormLabel>AF Claim Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="atFaultPartyInsuranceCompany" render={({ field }) => (
                  <FormItem><FormLabel>AF Insurance Company</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{insuranceCompanyOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
              )} />
               <FormField name="atFaultPartyInsurer" render={({ field }) => (
                  <FormItem><FormLabel>AF Insurer (manual)</FormLabel><FormControl><Input placeholder="Or enter manually" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter className="pt-4">
          <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cases
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Case
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

    