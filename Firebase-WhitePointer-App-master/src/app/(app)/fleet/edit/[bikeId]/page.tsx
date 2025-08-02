"use client";

import { useRouter, useParams } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useBikes } from "@/hooks/use-database";
import type { BikeFrontend } from "@/lib/database-schema";
import { NewBikeForm } from '../../new-bike-form';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function EditBikePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { data: bikes, loading, update: updateBike } = useBikes();
  const [bikeToEdit, setBikeToEdit] = useState<BikeFrontend | null>(null);
  
  const bikeId = params.bikeId as string;

  useEffect(() => {
    if (bikes && bikes.length > 0) {
      const foundBike = bikes.find(b => b.id === bikeId);
      setBikeToEdit(foundBike || null);
    }
  }, [bikes, bikeId]);

  const handleUpdateBike = async (bikeData: BikeFrontend) => {
    try {
      await updateBike(bikeId, bikeData);
      toast({
        title: "Success",
        description: "Bike details have been updated.",
      });
      router.push('/fleet');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update bike details.",
      });
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!bikeToEdit) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center h-full">
        <p>Bike not found.</p>
        <Link href="/fleet">Go back to fleet</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold">Edit Bike</h1>
                <p className="text-muted-foreground">Update details for bike {bikeToEdit.make} {bikeToEdit.model}</p>
            </div>
            <Link href="/fleet" className="text-sm flex items-center gap-2 hover:underline">
                <ArrowLeft className="h-4 w-4" /> Back to Fleet
            </Link>
        </div>
        <NewBikeForm onBikeSubmit={handleUpdateBike} bikeToEdit={bikeToEdit} />
    </div>
  );
}