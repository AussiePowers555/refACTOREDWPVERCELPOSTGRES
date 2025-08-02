
"use client";

import { useEffect, useState } from "react";
import type { CaseFrontend as Case } from "@/lib/database-schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, User, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const getMethodIcon = (method: string) => {
    switch(method) {
        case 'Call': return <Phone className="h-5 w-5 text-blue-500" />;
        case 'Email': return <Mail className="h-5 w-5 text-red-500" />;
        case 'Meeting': return <User className="h-5 w-5 text-green-500" />;
        default: return <MessageSquare className="h-5 w-5 text-gray-500" />;
    }
}

type Interaction = {
  id: string;
  caseNumber: string;
  source: string;
  method: string;
  situation: string;
  action: string;
  outcome: string;
  timestamp: string;
  caseInfo?: Pick<Case, 'clientName' | 'clientPhone' | 'clientEmail'>
};


export default function AllInteractionsPage() {
  const [allInteractions, setAllInteractions] = useState<Interaction[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/cases');
        if (!response.ok) {
          throw new Error('Failed to fetch cases');
        }
        const casesData = await response.json();
        setCases(casesData);
      } catch (error) {
        console.error('Error fetching cases:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && cases.length > 0) {
      const allLogs: Interaction[] = [];
      cases.forEach(c => {
        try {
          const interactionData = localStorage.getItem(`interactions_${c.caseNumber}`);
          if (interactionData) {
            const caseInteractions: Interaction[] = JSON.parse(interactionData);
            const interactionsWithCaseInfo = caseInteractions.map(interaction => ({
              ...interaction,
              caseInfo: {
                clientName: c.clientName,
                clientPhone: c.clientPhone || "N/A",
                clientEmail: c.clientEmail || "N/A"
              }
            }))
            allLogs.push(...interactionsWithCaseInfo);
          }
        } catch (error) {
          console.error(`Failed to parse interactions for case ${c.caseNumber}`, error);
        }
      });
      // Sort all interactions by timestamp, newest first
      allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAllInteractions(allLogs);
    }
  }, [cases]);

  return (
    <div className="flex flex-col gap-4">
       <Card>
        <CardHeader>
          <CardTitle>Master Interactions Log</CardTitle>
          <CardDescription>A complete log of all interactions across all cases.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : allInteractions.length > 0 ? (
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                    {allInteractions.map(interaction => (
                        <div key={interaction.id} className="flex gap-4 p-4 border rounded-lg">
                            <div className="mt-1">{getMethodIcon(interaction.method)}</div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{interaction.source} - {interaction.method}</p>
                                        <p className="text-xs text-muted-foreground">{format(new Date(interaction.timestamp), 'PPP p')}</p>
                                    </div>
                                    <div className="text-right">
                                       <Badge variant="secondary">Case: {interaction.caseNumber}</Badge>
                                       <p className="text-sm font-medium mt-1">{interaction.caseInfo?.clientName}</p>
                                    </div>
                                </div>
                                <div className="mt-4 space-y-2 text-sm">
                                    <p><strong className="text-muted-foreground">Situation:</strong> {interaction.situation}</p>
                                    <p><strong className="text-muted-foreground">Action:</strong> {interaction.action}</p>
                                    <p><strong className="text-muted-foreground">Outcome:</strong> {interaction.outcome}</p>
                                </div>
                                 <div className="mt-2 text-xs text-muted-foreground flex gap-4">
                                   <span><Phone className="inline h-3 w-3 mr-1" />{interaction.caseInfo?.clientPhone}</span>
                                   <span><Mail className="inline h-3 w-3 mr-1" />{interaction.caseInfo?.clientEmail}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
            ) : (
                <p className="text-muted-foreground text-center py-10">No interactions have been logged yet.</p>
            )}
        </div>
      </CardContent>
       </Card>
    </div>
  );
}

