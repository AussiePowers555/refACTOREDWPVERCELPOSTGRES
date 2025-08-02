
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { generateEmailAction } from "./actions"
import { Label } from "@/components/ui/label"


const formSchema = z.object({
  recipientType: z.enum([
    'insurance_company',
    'client',
    'at_fault_party',
    'collections_agency',
    'legal_counsel',
    'service_provider',
  ]),
  purpose: z.enum([
    'demand_payment',
    'status_update',
    'document_request',
    'settlement_negotiation',
    'appointment_scheduling',
    'claim_closure',
    'follow_up',
  ]),
  tone: z.enum([
    'professional',
    'friendly',
    'formal',
    'urgent',
    'apologetic',
    'persuasive',
  ]),
  additionalContext: z.string().min(1, "Additional context is required."),
  caseNumber: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const formOptions = {
  recipientType: [
    { value: 'insurance_company', label: 'Insurance Company' },
    { value: 'client', label: 'Client' },
    { value: 'at_fault_party', label: 'At-fault Party' },
    { value: 'collections_agency', label: 'Collections Agency' },
    { value: 'legal_counsel', label: 'Legal Counsel' },
    { value: 'service_provider', label: 'Service Provider' },
  ],
  purpose: [
    { value: 'demand_payment', label: 'Demand Payment' },
    { value: 'status_update', label: 'Status Update' },
    { value: 'document_request', label: 'Document Request' },
    { value: 'settlement_negotiation', label: 'Settlement Negotiation' },
    { value: 'appointment_scheduling', label: 'Appointment Scheduling' },
    { value: 'claim_closure', label: 'Claim Closure' },
    { value: 'follow_up', label: 'Follow-up' },
  ],
  tone: [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'formal', label: 'Formal' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'apologetic', label: 'Apologetic' },
    { value: 'persuasive', label: 'Persuasive' },
  ],
};

interface EmailFormProps {
  caseNumber?: string;
}

export function EmailForm({ caseNumber }: EmailFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientType: 'insurance_company',
      purpose: 'demand_payment',
      tone: 'professional',
      additionalContext: "",
      caseNumber: caseNumber || "",
    },
  });
  
  // Watch for caseNumber prop changes and update the form
  useState(() => {
    if (caseNumber) {
      form.setValue('caseNumber', caseNumber);
    }
  });


  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setGeneratedEmail(null);
    const result = await generateEmailAction(values);
    setIsLoading(false);

    if (result.success && result.data) {
      setGeneratedEmail(result.data);
      toast({
        title: "Success",
        description: "Email content generated successfully.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>AI Email Generator</CardTitle>
          <CardDescription>
            Fill in the details below to generate a new email template with AI assistance.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="recipientType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {formOptions.recipientType.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {formOptions.purpose.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tone</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {formOptions.tone.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="additionalContext"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Context</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide any specific details or requirements for this email..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Email
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Generated Email</CardTitle>
          <CardDescription>
            The AI-generated email content will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {generatedEmail ? (
             <div className="space-y-4">
                <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" readOnly value={generatedEmail.subject} />
                </div>
                <div>
                    <Label htmlFor="body">Body</Label>
                    <Textarea
                        id="body"
                        readOnly
                        value={generatedEmail.body}
                        className="h-64 resize-none"
                    />
                </div>
            </div>
          ) : (
             <div className="flex items-center justify-center h-64 rounded-lg border-2 border-dashed border-muted-foreground/20">
                <p className="text-muted-foreground">
                    {isLoading ? "Generating..." : "Your email will be generated here."}
                </p>
             </div>
          )}
        </CardContent>
        {generatedEmail && (
            <CardFooter>
                <Button onClick={() => {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(generatedEmail.body).catch(() => {
                            // Fallback
                            const textArea = document.createElement('textarea');
                            textArea.value = generatedEmail.body;
                            document.body.appendChild(textArea);
                            textArea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textArea);
                        });
                    } else {
                        // Fallback for browsers without clipboard support
                        const textArea = document.createElement('textarea');
                        textArea.value = generatedEmail.body;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                    }
                }}>Copy Body</Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
