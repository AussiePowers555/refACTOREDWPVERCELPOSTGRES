
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Car, Eraser, Save, Loader2 } from "lucide-react";
import type { CaseFrontend as Case } from "@/lib/database-schema";

interface AccidentDetailsProps {
  caseData: Case;
  onCaseUpdate: (data: Partial<Case>) => void;
}

export default function AccidentDetails({ caseData, onCaseUpdate }: AccidentDetailsProps) {
  const { toast } = useToast();
  const sigPadRef = useRef<SignatureCanvas>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [accidentDate, setAccidentDate] = useState(caseData.accidentDate || "");
  const [accidentTime, setAccidentTime] = useState(caseData.accidentTime || "");
  const [accidentDescription, setAccidentDescription] = useState(caseData.accidentDescription || "");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save function with debouncing
  const debouncedSave = useCallback(async () => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for 500ms
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const diagram = sigPadRef.current?.isEmpty()
          ? caseData.accidentDiagram // Keep existing if empty
          : sigPadRef.current?.toDataURL();

        await onCaseUpdate({
          ...caseData,
          accidentDate,
          accidentTime,
          accidentDescription,
          accidentDiagram: diagram
        });
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, 500);
  }, [caseData, accidentDate, accidentTime, accidentDescription, onCaseUpdate]);

  // Auto-save when fields change
  useEffect(() => {
    if (accidentDate !== (caseData.accidentDate || "") ||
        accidentTime !== (caseData.accidentTime || "") ||
        accidentDescription !== (caseData.accidentDescription || "")) {
      debouncedSave();
    }
  }, [accidentDate, accidentTime, accidentDescription, debouncedSave, caseData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleClear = () => {
    sigPadRef.current?.clear();
  };

  const handleSave = () => {
    const diagram = sigPadRef.current?.isEmpty() 
      ? caseData.accidentDiagram // Keep existing if empty
      : sigPadRef.current?.toDataURL();

    onCaseUpdate({
      ...caseData,
      accidentDate,
      accidentTime,
      accidentDescription,
      accidentDiagram: diagram
    });
    
    toast({
      title: "Accident Details Saved",
      description: "The accident information and diagram have been updated.",
    });
  };
  
  // Effect to load existing diagram
  useState(() => {
    if (caseData.accidentDiagram && sigPadRef.current) {
      sigPadRef.current.fromDataURL(caseData.accidentDiagram);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Car/> Accident Details</CardTitle>
        <CardDescription>Record information and sketch the accident scene.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="accidentDate">Date</Label>
            <Input id="accidentDate" type="date" value={accidentDate} onChange={e => setAccidentDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="accidentTime">Time</Label>
            <Input id="accidentTime" type="time" value={accidentTime} onChange={e => setAccidentTime(e.target.value)} />
          </div>
        </div>
         <div className="space-y-1">
          <Label htmlFor="accidentDescription">Description</Label>
          <Textarea 
            id="accidentDescription" 
            placeholder="Briefly describe the accident..." 
            className="resize-none"
            value={accidentDescription}
            onChange={e => setAccidentDescription(e.target.value)}
          />
        </div>
        <div>
          <Label>Accident Diagram</Label>
          <div className="mt-1 rounded-lg border border-input bg-background overflow-hidden">
            <SignatureCanvas
              ref={sigPadRef}
              penColor="black"
              canvasProps={{ className: "w-full aspect-video" }}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between items-center">
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
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleClear}><Eraser className="mr-2 h-4 w-4"/>Clear</Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4"/>
            {isSaving ? 'Auto-saving...' : 'Save Now'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
