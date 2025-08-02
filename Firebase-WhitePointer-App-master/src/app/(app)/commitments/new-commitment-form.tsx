
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import type { CaseFrontend as Case } from "@/lib/database-schema";
import type { Commitment } from "@/types/commitment";
import { CalendarIcon } from "lucide-react";

const commitmentSchema = z.object({
  id: z.string().optional(),
  caseNumber: z.string().min(1, "Please select a case."),
  dueDate: z.date({
    required_error: "A due date is required.",
  }),
  note: z.string().min(1, "A note is required."),
});

type FormValues = z.infer<typeof commitmentSchema>;

interface CommitmentFormProps {
  cases: Case[];
  commitmentToEdit?: Commitment | null;
  onSubmit: (data: Omit<Commitment, 'status' | 'id'> & { id?: string }) => void;
  setDialogOpen: (open: boolean) => void;
}

export function NewCommitmentForm({ cases, commitmentToEdit, onSubmit, setDialogOpen }: CommitmentFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(commitmentSchema),
    defaultValues: commitmentToEdit ? {
        id: commitmentToEdit.id,
        caseNumber: commitmentToEdit.caseNumber,
        dueDate: new Date(commitmentToEdit.dueDate),
        note: commitmentToEdit.note,
    } : {
        note: "",
    },
  });

  const handleFormSubmit = (values: FormValues) => {
    onSubmit({
        ...values,
        id: commitmentToEdit?.id,
        dueDate: format(values.dueDate, "yyyy-MM-dd"),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="caseNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Case</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a case..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {cases.map(c => (
                    <SelectItem key={c.caseNumber} value={c.caseNumber}>
                      {c.caseNumber} - {c.clientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Due Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter commitment details, e.g., 'Follow up with insurer for settlement offer'"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit">{commitmentToEdit ? 'Save Changes' : 'Create Commitment'}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

