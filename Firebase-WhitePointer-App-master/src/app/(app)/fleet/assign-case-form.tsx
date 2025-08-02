
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

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
import type { BikeFrontend as Bike, CaseFrontend as Case } from "@/lib/database-schema"


const formSchema = z.object({
  caseNumber: z.string().min(1, "Please select a case."),
  startDate: z.string().min(1, "Please select a start date."),
  endDate: z.string().min(1, "Please select an end date."),
})

type FormValues = z.infer<typeof formSchema>

interface AssignCaseFormProps {
    bike: Bike;
    cases: Case[];
    onAssign: (bikeId: string, caseNumber: string, startDate: string, endDate: string) => void;
    setDialogOpen: (open: boolean) => void;
}

export function AssignCaseForm({ bike, cases, onAssign, setDialogOpen }: AssignCaseFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  })

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    onAssign(bike.id, values.caseNumber, values.startDate, values.endDate);
    setIsLoading(false);
    setDialogOpen(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="caseNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Case</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select a case to assign..." /></SelectTrigger>
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
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assignment Start Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assignment End Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Bike
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
