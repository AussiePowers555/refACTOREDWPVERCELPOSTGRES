"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import type { ContactFrontend as Contact } from "@/lib/database-schema";
import { useState } from "react";
import { Loader } from "lucide-react";

const contactSchema = z.object({
  company: z.string().optional(),
  name: z.string().min(1, "Name is required."),
  type: z.enum(['Client', 'Lawyer', 'Insurer', 'Repairer', 'Rental Company', 'Service Center', 'Other']),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  address: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

interface AddContactFormProps {
  onAddContact: (contact: ContactFormValues) => void;
  setDialogOpen: (open: boolean) => void;
  activeTab: Contact['type'];
}

export function AddContactForm({ onAddContact, setDialogOpen, activeTab }: AddContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      company: "",
      name: "",
      type: activeTab || 'Insurer',
      phone: "",
      email: "",
      address: "",
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      await onAddContact(values);
    } catch (error) {
      // Error is handled by parent
    } finally {
      setIsSubmitting(false);
      form.reset();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField control={form.control} name="type" render={({ field }) => (
            <FormItem>
                <FormLabel>Contact Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="Client">Client</SelectItem>
                        <SelectItem value="Lawyer">Lawyer</SelectItem>
                        <SelectItem value="Insurer">Insurer</SelectItem>
                        <SelectItem value="Repairer">Repairer</SelectItem>
                        <SelectItem value="Rental Company">Rental Company</SelectItem>
                        <SelectItem value="Service Center">Service Center</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
        )} />
        <FormField control={form.control} name="company" render={({ field }) => (
            <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
         <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem>
            <FormLabel>Phone</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl><Input type="email" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="address" render={({ field }) => (
          <FormItem>
            <FormLabel>Address</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center">
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </span>
            ) : "Add Contact"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
