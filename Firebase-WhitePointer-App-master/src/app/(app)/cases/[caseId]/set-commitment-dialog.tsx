
"use client";

import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Commitment } from "@/types/commitment";

interface SetCommitmentDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    interaction: {
        caseNumber: string;
        outcome: string;
    };
    onCreateCommitment: (commitment: Omit<Commitment, 'id' | 'status'>) => void;
}

const addBusinessDays = (date: Date, days: number): Date => {
    let newDate = new Date(date);
    let addedDays = 0;
    while (addedDays < days) {
        newDate.setDate(newDate.getDate() + 1);
        const dayOfWeek = newDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0=Sunday, 6=Saturday
            addedDays++;
        }
    }
    return newDate;
};


export default function SetCommitmentDialog({ isOpen, setIsOpen, interaction, onCreateCommitment }: SetCommitmentDialogProps) {
    const { toast } = useToast();
    const [commitmentDate, setCommitmentDate] = useState<Date | undefined>(addBusinessDays(new Date(), 14));
    const [note, setNote] = useState("");

    useEffect(() => {
        if(isOpen) {
            setCommitmentDate(addBusinessDays(new Date(), 14));
            setNote(`Follow up on: ${interaction.outcome}`);
        }
    }, [isOpen, interaction.outcome]);

    const handleSave = () => {
        if (!commitmentDate) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please select a commitment date.",
            });
            return;
        }

        onCreateCommitment({
            caseNumber: interaction.caseNumber,
            dueDate: format(commitmentDate, "yyyy-MM-dd"),
            note: note,
        });

        toast({
            title: "Commitment Created",
            description: `Follow-up set for ${format(commitmentDate, "PPP")}.`,
        });
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Set New Commitment</DialogTitle>
                    <DialogDescription>
                        A new interaction has been logged. Set a follow-up commitment date.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex flex-col items-center">
                        <Label className="mb-2">Commitment Due Date</Label>
                        <Calendar
                            mode="single"
                            selected={commitmentDate}
                            onSelect={setCommitmentDate}
                            className="rounded-md border"
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="commitment-note">Note</Label>
                        <Textarea
                            id="commitment-note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Add a note for this commitment..."
                            className="resize-none"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Skip</Button>
                    <Button onClick={handleSave}>Save Commitment</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
