
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, User, Share2, MessageSquare, MoreHorizontal, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import SetCommitmentDialog from "./set-commitment-dialog";
import type { Commitment } from "@/types/commitment";
import { useToast } from "@/hooks/use-toast";

const interactionSchema = z.object({
  id: z.string(),
  caseNumber: z.string(),
  source: z.enum(['Lawyer', 'AF Insurer', 'Client Insurer', 'Client', 'Service Centre']),
  method: z.enum(['Call', 'Email', 'Meeting']),
  situation: z.string().min(1, "Situation is required."),
  action: z.string().min(1, "Action is required."),
  outcome: z.string().min(1, "Outcome is required."),
  timestamp: z.string(),
});

type Interaction = z.infer<typeof interactionSchema>;
type FormValues = Omit<Interaction, 'id' | 'caseNumber' | 'timestamp'>;

interface CommunicationLogProps {
  caseNumber: string;
}

const interactionSources = ['Lawyer', 'AF Insurer', 'Client Insurer', 'Client', 'Service Centre'];
const interactionMethods = ['Call', 'Email', 'Meeting'];

const getMethodIcon = (method: string) => {
    switch(method) {
        case 'Call': return <Phone className="h-5 w-5 text-blue-500" />;
        case 'Email': return <Mail className="h-5 w-5 text-red-500" />;
        case 'Meeting': return <User className="h-5 w-5 text-green-500" />;
        default: return <MessageSquare className="h-5 w-5 text-gray-500" />;
    }
}

export default function CommunicationLog({ caseNumber }: CommunicationLogProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [isCommitmentDialogOpen, setCommitmentDialogOpen] = useState(false);
  const [lastInteraction, setLastInteraction] = useState<Interaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load interactions from database
  useEffect(() => {
    const loadInteractions = async () => {
      try {
        const response = await fetch(`/api/interactions?caseNumber=${encodeURIComponent(caseNumber)}`);
        const data = await response.json();
        
        if (data.success) {
          setInteractions(data.interactions);
        } else {
          console.error('Failed to load interactions:', data.error);
        }
      } catch (error) {
        console.error('Error loading interactions:', error);
      }
    };

    if (caseNumber) {
      loadInteractions();
    }
  }, [caseNumber]);

  const form = useForm<FormValues>({
    resolver: zodResolver(interactionSchema.omit({ id: true, caseNumber: true, timestamp: true })),
    defaultValues: {
      source: 'Client',
      method: 'Call',
      situation: "",
      action: "",
      outcome: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseNumber: caseNumber,
          ...values,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const newInteraction: Interaction = {
          id: data.interaction.id,
          caseNumber: caseNumber,
          timestamp: data.interaction.timestamp,
          ...values,
        };
        
        setLastInteraction(newInteraction);
        setInteractions([newInteraction, ...interactions]);
        
        form.reset({
          source: 'Client',
          method: 'Call',
          situation: "",
          action: "",
          outcome: "",
        });
        
        setCommitmentDialogOpen(true);
        
        toast({
          title: "Interaction Logged",
          description: "The interaction has been saved successfully."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Failed to Log Interaction",
          description: data.error || "An error occurred while saving the interaction."
        });
      }
    } catch (error) {
      console.error('Error saving interaction:', error);
      toast({
        variant: "destructive",
        title: "Failed to Log Interaction",
        description: "Network error. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCommitment = (commitment: Omit<Commitment, 'id' | 'status'>) => {
    const newCommitment: Commitment = {
        id: `com-${Date.now()}`,
        status: 'Open',
        ...commitment
    }
    setCommitments([newCommitment, ...commitments]);
  }

  const handleShare = (interaction: Interaction) => {
    const shareText = `
        Interaction Log for Case: ${interaction.caseNumber}
        Date: ${format(new Date(interaction.timestamp), "PPP p")}
        Method: ${interaction.method}
        Source: ${interaction.source}
        
        Situation:
        ${interaction.situation}

        Action:
        ${interaction.action}

        Outcome:
        ${interaction.outcome}
    `.trim();

    if (navigator.share) {
        navigator.share({
            title: `Case Interaction: ${interaction.caseNumber}`,
            text: shareText,
        }).catch(console.error);
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText).then(() => {
            alert("Interaction details copied to clipboard. You can now paste it to share.");
        }).catch(() => {
            // Fallback for browsers without clipboard support
            const textArea = document.createElement('textarea');
            textArea.value = shareText;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                alert("Interaction details copied to clipboard. You can now paste it to share.");
            } catch (err) {
                alert("Unable to copy to clipboard. Please manually copy the text from the console.");
                console.log("Interaction details:", shareText);
            }
            document.body.removeChild(textArea);
        });
    } else {
        // Fallback for browsers without clipboard support
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            alert("Interaction details copied to clipboard. You can now paste it to share.");
        } catch (err) {
            alert("Unable to copy to clipboard. Please manually copy the text from the console.");
            console.log("Interaction details:", shareText);
        }
        document.body.removeChild(textArea);
    }
  }


  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Communication Log</CardTitle>
        <CardDescription>Log all interactions related to this case.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="source" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Interaction Source</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                        <SelectContent>{interactionSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                        <FormMessage />
                     </FormItem>
                )} />
                <FormField control={form.control} name="method" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{interactionMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                        <FormMessage />
                     </FormItem>
                )} />
            </div>
            <div className="space-y-4">
                 <FormField control={form.control} name="situation" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Situation</FormLabel>
                        <FormControl><Textarea placeholder="Describe the situation..." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="action" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Action</FormLabel>
                        <FormControl><Textarea placeholder="What action was taken?" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="outcome" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Outcome</FormLabel>
                        <FormControl><Textarea placeholder="What was the outcome?" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Log Interaction"}
            </Button>
          </form>
        </Form>
        <Separator className="my-8" />

        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Logged Interactions</h3>
            {interactions.length > 0 ? (
                 <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4">
                    {interactions.map(interaction => (
                        <div key={interaction.id} className="flex gap-4">
                            <div className="mt-1">{getMethodIcon(interaction.method)}</div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{interaction.source} - {interaction.method}</p>
                                        <p className="text-xs text-muted-foreground">{format(new Date(interaction.timestamp), 'PPP p')}</p>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={() => handleShare(interaction)}
                                        title="Copy interaction to clipboard"
                                    >
                                        <Share2 className="h-4 w-4" />
                                        <span className="sr-only">Share</span>
                                    </Button>
                                </div>
                                <div className="mt-2 space-y-2 text-sm">
                                    <p><strong className="text-muted-foreground">Situation:</strong> {interaction.situation}</p>
                                    <p><strong className="text-muted-foreground">Action:</strong> {interaction.action}</p>
                                    <p><strong className="text-muted-foreground">Outcome:</strong> {interaction.outcome}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
            ) : (
                <p className="text-muted-foreground text-sm">No interactions have been logged for this case yet.</p>
            )}
        </div>
      </CardContent>
    </Card>
    {lastInteraction && (
        <SetCommitmentDialog
            isOpen={isCommitmentDialogOpen}
            setIsOpen={setCommitmentDialogOpen}
            interaction={lastInteraction}
            onCreateCommitment={handleCreateCommitment}
        />
    )}
    </>
  );
}
