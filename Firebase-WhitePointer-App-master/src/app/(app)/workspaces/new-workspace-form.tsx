
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import type { ContactFrontend as Contact, WorkspaceFrontend as Workspace } from "@/lib/database-schema";

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Workspace name is required."),
  contactId: z.string().min(1, "Please select a contact."),
});

type FormValues = z.infer<typeof formSchema>;

interface NewWorkspaceFormProps {
  contacts: Contact[];
  workspaceToEdit?: Workspace | null;
  onSubmit: (data: FormValues) => void;
  setDialogOpen: (open: boolean) => void;
  activeCategory: Contact['type'];
}

export function NewWorkspaceForm({ contacts, workspaceToEdit, onSubmit: handleSubmit, setDialogOpen, activeCategory }: NewWorkspaceFormProps) {
  const isEditMode = !!workspaceToEdit;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: workspaceToEdit ? {
        id: workspaceToEdit.id,
        name: workspaceToEdit.name,
        contactId: workspaceToEdit.contactId
    } : {
        name: "",
        contactId: ""
    }
  });

  const onFormSubmit = (values: FormValues) => {
    handleSubmit(values);
  };
  
  const relevantContacts = contacts.filter(c => c.type === activeCategory);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workspace Name</FormLabel>
              <FormControl>
                <Input placeholder={`e.g., Cases for ${activeCategory}`} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select {activeCategory} Contact</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select a contact for this workspace...`} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {relevantContacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit">{isEditMode ? "Save Changes" : "Create Workspace"}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
