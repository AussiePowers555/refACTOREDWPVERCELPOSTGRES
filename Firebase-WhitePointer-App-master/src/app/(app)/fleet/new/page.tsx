
"use client";

import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useBikes } from "@/hooks/use-database";
import type { BikeFrontend } from "@/lib/database-schema";
import { NewBikeForm } from '../new-bike-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewBikePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { create: createBike } = useBikes();

  const handleAddBike = async (bikeData: BikeFrontend) => {
    try {
      await createBike({
        ...bikeData,
        createdDate: new Date().toISOString(),
        year: bikeData.year ? Number(bikeData.year) : undefined
      });
      toast({
        title: "Success",
        description: "New bike has been added to the fleet.",
      });
      router.push('/fleet');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add bike to fleet.",
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold">Add New Bike</h1>
                <p className="text-muted-foreground">Add a motorcycle to the rental fleet</p>
            </div>
             <Link href="/fleet" className="text-sm flex items-center gap-2 hover:underline">
                <ArrowLeft className="h-4 w-4" /> Back to Fleet
             </Link>
        </div>
        <NewBikeForm onBikeSubmit={handleAddBike} />
    </div>
  );
}
