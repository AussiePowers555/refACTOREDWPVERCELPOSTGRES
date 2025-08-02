
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { CaseFrontend as Case, ContactFrontend as Contact } from "@/lib/database-schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, User, ShieldAlert, Save, Banknote, Handshake, Landmark, FileWarning, PiggyBank, DollarSign, Scale } from "lucide-react";
import { ContactPicker } from "../contact-picker";
import { useState, useEffect, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  caseNumber: z.string().nullable().optional().transform(val => val || ""),
  rentalCompany: z.string().nullable().optional().transform(val => val || ""),
  lawyer: z.string().nullable().optional().transform(val => val || ""),
  
  // Client fields
  clientName: z.string().min(1, "Client name is required."),
  clientPhone: z.string().nullable().optional().transform(val => val || ""),
  clientEmail: z.string().nullable().optional().transform(val => val || "").pipe(z.string().email("Invalid email address.").optional().or(z.literal(''))),
  clientStreetAddress: z.string().nullable().optional().transform(val => val || ""),
  clientSuburb: z.string().nullable().optional().transform(val => val || ""),
  clientState: z.string().nullable().optional().transform(val => val || ""),
  clientPostcode: z.string().nullable().optional().transform(val => val || ""),
  clientClaimNumber: z.string().nullable().optional().transform(val => val || ""),
  clientInsuranceCompany: z.string().nullable().optional().transform(val => val || ""),
  clientInsurer: z.string().nullable().optional().transform(val => val || ""),

  // At-Fault party fields
  atFaultPartyName: z.string().min(1, "At-fault party name is required."),
  atFaultPartyPhone: z.string().nullable().optional().transform(val => val || ""),
  atFaultPartyEmail: z.string().nullable().optional().transform(val => val || "").pipe(z.string().email("Invalid email address.").optional().or(z.literal(''))),
  atFaultPartyStreetAddress: z.string().nullable().optional().transform(val => val || ""),
  atFaultPartySuburb: z.string().nullable().optional().transform(val => val || ""),
  atFaultPartyState: z.string().nullable().optional().transform(val => val || ""),
  atFaultPartyPostcode: z.string().nullable().optional().transform(val => val || ""),
  atFaultPartyClaimNumber: z.string().nullable().optional().transform(val => val || ""),
  atFaultPartyInsuranceCompany: z.string().nullable().optional().transform(val => val || ""),
  atFaultPartyInsurer: z.string().nullable().optional().transform(val => val || ""),
  
  // Financials
  invoiced: z.coerce.number().optional(),
  reserve: z.coerce.number().optional(),
  agreed: z.coerce.number().optional(),
  paid: z.coerce.number().optional(),
});

type CaseFormValues = z.infer<typeof formSchema>;

const stateOptions = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
const insuranceCompanyOptions = ["AllState", "Geico", "Progressive", "State Farm", "Liberty Mutual", "Other"];
const rentalCompanyOptions = ["PBikeRescue Rentals", "City Wide Rentals", "Partner Rentals Inc."];

interface CaseDetailFormProps {
  caseData: Case;
  onCaseUpdate: (data: Partial<Case>) => void;
  contacts: Contact[];
  onAddContact: (contact: Omit<Contact, 'id'>) => Contact;
}

export function CaseDetailForm({ caseData, onCaseUpdate, contacts, onAddContact }: CaseDetailFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...caseData,
      clientEmail: caseData.clientEmail || "",
      atFaultPartyEmail: caseData.atFaultPartyEmail || "",
    },
  });

  // Auto-save function with debouncing
  const debouncedSave = useCallback(async (values: CaseFormValues) => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for 500ms
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);

      try {
        // Validate the form data before saving
        const result = formSchema.safeParse(values);
        if (!result.success) {
          // Skip auto-save if validation fails, but don't show error
          setIsSaving(false);
          return;
        }

        // Make direct API call for auto-save (silent, no toast)
        const response = await fetch(`/api/cases/${caseData.id || caseData.caseNumber}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...caseData,
            ...values,
            lastUpdated: 'Just now',
          }),
        });

        if (!response.ok) {
          throw new Error(`Auto-save failed: ${response.status} ${response.statusText}`);
        }

        // Update the last saved timestamp
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, 500);
  }, [caseData]);

  // Manual save function
  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      const values = form.getValues();
      await onCaseUpdate(values);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Manual save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form when case data changes
  useEffect(() => {
    form.reset({
      ...caseData,
      clientEmail: caseData.clientEmail || "",
      atFaultPartyEmail: caseData.atFaultPartyEmail || "",
    });
  }, [caseData, form]);

  // Watch for form changes and trigger auto-save
  useEffect(() => {
    const subscription = form.watch((values) => {
      // Auto-save if form has been touched (regardless of validation state)
      // The debouncedSave function will handle validation internally
      if (form.formState.isDirty) {
        debouncedSave(values as CaseFormValues);
      }
    });

    return () => {
      subscription.unsubscribe();
      // Clear timeout on cleanup
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form, debouncedSave]);

  const onSubmit = (values: CaseFormValues) => {
    setIsLoading(true);
    onCaseUpdate(values); 
    setIsLoading(false);
  };

  const handleSelectContact = (contact: Contact, fieldName: keyof CaseFormValues) => {
    form.setValue(fieldName as any, contact.name, { shouldDirty: true });
    if(fieldName === 'clientName') {
        form.setValue('clientPhone', contact.phone || '', { shouldDirty: true });
        form.setValue('clientEmail', contact.email || '', { shouldDirty: true });
        form.setValue('clientStreetAddress', contact.address || '', { shouldDirty: true });
    } else if (fieldName === 'atFaultPartyName') {
        form.setValue('atFaultPartyPhone', contact.phone || '', { shouldDirty: true });
        form.setValue('atFaultPartyEmail', contact.email || '', { shouldDirty: true });
        form.setValue('atFaultPartyStreetAddress', contact.address || '', { shouldDirty: true });
    }

    // Trigger auto-save after contact selection
    const currentValues = form.getValues();
    debouncedSave(currentValues);
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
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
                        onAddContact={onAddContact}
                        contactType="Lawyer"
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User /> Client Information</CardTitle>
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
                      onAddContact={onAddContact}
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

              {/* Manual Save Button for Client Information */}
              <div className="flex justify-end mt-4">
                <Button
                  type="button"
                  onClick={handleManualSave}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Client Info"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldAlert /> At-Fault Party Information</CardTitle>
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
                        onAddContact={onAddContact}
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

              {/* Manual Save Button for At-Fault Party Information */}
              <div className="flex justify-end mt-4">
                <Button
                  type="button"
                  onClick={handleManualSave}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save At-Fault Info"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign /> Financials</CardTitle>
            <CardDescription>Manage the financial details for this case. The outstanding amount is calculated automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                  <FormField name="invoiced" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-1"><Banknote className="h-4 w-4"/> Invoiced</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField name="reserve" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-1"><PiggyBank className="h-4 w-4"/> Reserve</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField name="agreed" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-1"><Handshake className="h-4 w-4"/> Agreed</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField name="paid" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-1"><Landmark className="h-4 w-4"/> Paid</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <div className="space-y-2">
                      <FormLabel className="flex items-center gap-1"><FileWarning className="h-4 w-4"/> Outstanding</FormLabel>
                      <Badge 
                        variant={((form.getValues('agreed') || 0) - (form.getValues('paid') || 0)) > 0 ? "destructive" : "default"} 
                        className="text-lg py-2 w-full justify-center"
                      >
                        ${((form.getValues('agreed') || 0) - (form.getValues('paid') || 0)).toFixed(2)}
                      </Badge>
                   </div>
             </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
                {isSaving && (
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Auto-saving...</span>
                    </div>
                )}
                {!isSaving && lastSaved && (
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                    </div>
                )}
                {!isSaving && !lastSaved && form.formState.isDirty && (
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                        <span>Changes will auto-save...</span>
                    </div>
                )}
            </div>
            <Button type="submit" disabled={isLoading || isSaving} variant="outline">
                {(isLoading || isSaving) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Auto-saving...' : 'Save Now'}
            </Button>
        </div>
      </form>
    </Form>
  );
}

    