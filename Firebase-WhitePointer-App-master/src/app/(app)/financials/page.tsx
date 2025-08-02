
"use client";

import { useEffect, useState } from "react";
import type { CaseFrontend as Case } from "@/lib/database-schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Banknote, CalendarIcon, PiggyBank, FileDigit, Handshake, Landmark, FileWarning, Receipt, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function FinancialsPage() {
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

  const kpiData = cases.reduce((acc, c) => {
    acc.invoiced += c.invoiced || 0;
    acc.settlementAgreed += c.agreed || 0;
    acc.fundsReceived += c.paid || 0;
    acc.reserve += c.reserve || 0;
    return acc;
  }, {
    invoiced: 0,
    settlementAgreed: 0,
    fundsReceived: 0,
    outstanding: 0, // This will be calculated from agreed and paid
    reserve: 0,
  });

  kpiData.outstanding = kpiData.settlementAgreed - kpiData.fundsReceived;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Banknote /> Financial Overview</h1>
            <p className="text-muted-foreground">Track invoicing, payments, and outstanding amounts</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-gradient-to-br from-primary/10 to-background">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Reserve Amount</CardTitle>
            <PiggyBank className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">${kpiData.reserve.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Funds allocated for case settlements and claims. Updated automatically with case financial changes.</p>
          </CardContent>
        </Card>
        <div className="md:col-span-2 grid grid-cols-2 gap-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Active Cases</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{cases.length}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Avg Reserve</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-2xl font-bold">${(cases.length > 0 ? kpiData.reserve / cases.length : 0).toFixed(2)}</p>
                </CardContent>
            </Card>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
            <CalendarIcon className="h-4 w-4"/>
            <span className="font-semibold">All Time</span>
        </div>
      </div>

      <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Collection Tracking for Accounting</AlertTitle>
          <AlertDescription className="text-xs space-y-1">
              <p><span className="font-semibold">Settlement Agreed:</span> Commercial agreement reached with insurance company</p>
              <p><span className="font-semibold">Funds Received:</span> Actual cash received in bank account</p>
              <p><span className="font-semibold">Outstanding:</span> Settlement Agreed minus Funds Received (what's still owed)</p>
              <p className="pt-1"><span className="italic">Note: Invoiced and Reserve figures are reference only and not used in collection calculations</span></p>
          </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between"><CardTitle className="text-sm">TOTAL INVOICED</CardTitle><FileDigit className="h-4 w-4 text-muted-foreground"/></CardHeader>
            <CardContent><p className="text-2xl font-bold">${kpiData.invoiced.toFixed(2)}</p><p className="text-xs text-muted-foreground">Reference figure only</p></CardContent>
          </Card>
           <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between"><CardTitle className="text-sm">TOTAL SETTLEMENT AGREED</CardTitle><Handshake className="h-4 w-4 text-muted-foreground"/></CardHeader>
            <CardContent><p className="text-2xl font-bold">${kpiData.settlementAgreed.toFixed(2)}</p><p className="text-xs text-muted-foreground">Commercial agreements reached</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between"><CardTitle className="text-sm">TOTAL FUNDS RECEIVED</CardTitle><Landmark className="h-4 w-4 text-muted-foreground"/></CardHeader>
            <CardContent><p className="text-2xl font-bold">${kpiData.fundsReceived.toFixed(2)}</p><p className="text-xs text-muted-foreground">Actual cash in bank</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between"><CardTitle className="text-sm">TOTAL OUTSTANDING</CardTitle><FileWarning className="h-4 w-4 text-muted-foreground"/></CardHeader>
            <CardContent><p className="text-2xl font-bold">${kpiData.outstanding.toFixed(2)}</p><p className="text-xs text-muted-foreground">Settlement agreed - funds received</p></CardContent>
          </Card>
      </div>

      <div>
        <div className="bg-primary/10 p-4 rounded-t-lg">
             <h3 className="text-lg font-semibold flex items-center gap-2"><Receipt /> Cases with Financial Data</h3>
             <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1"><Info className="h-4 w-4"/>Financial data is read-only on this page. Values are managed in the individual case view.</p>
        </div>
        <div className="border border-t-0 rounded-b-lg">
            <ScrollArea className="h-72">
                 <Table>
                    <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-sm">
                        <TableRow>
                            <TableHead className="w-[120px]">Case #</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead className="text-right">Invoiced</TableHead>
                            <TableHead className="text-right">Reserve</TableHead>
                            <TableHead className="text-right">Agreed</TableHead>
                            <TableHead className="text-right">Paid</TableHead>
                            <TableHead className="text-right">Outstanding</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cases.map(c => {
                            const outstanding = (c.agreed || 0) - (c.paid || 0);
                            return (
                                <TableRow key={c.caseNumber}>
                                    <TableCell className="font-medium">{c.caseNumber}</TableCell>
                                    <TableCell>{c.clientName}</TableCell>
                                    <TableCell className="text-right">${(c.invoiced || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-right">${(c.reserve || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-right">${(c.agreed || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-right">${(c.paid || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={outstanding > 0 ? "destructive" : "default"}>
                                            ${outstanding.toFixed(2)}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                 </Table>
            </ScrollArea>
        </div>
      </div>
    </div>
  );
}
