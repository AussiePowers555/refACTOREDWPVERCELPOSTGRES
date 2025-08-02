"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Upload } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { BikeFrontend } from "@/lib/database-schema"

const formSchema = z.object({
  id: z.string().optional(),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  registration: z.string().optional(),
  registrationExpires: z.date().optional(),
  serviceCenter: z.string().optional(),
  serviceCenterContactId: z.string().optional(),
  deliveryStreet: z.string().optional(),
  deliverySuburb: z.string().optional(),
  deliveryState: z.string().optional(),
  deliveryPostcode: z.string().optional(),
  lastServiceDate: z.date().optional(),
  serviceNotes: z.string().optional(),
  status: z.enum(['available', 'assigned', 'maintenance', 'retired']).default('available'),
  location: z.string().optional(),
  dailyRate: z.coerce.number().optional(),
  dailyRateA: z.coerce.number().optional(),
  dailyRateB: z.coerce.number().optional(),
  imageUrl: z.string().optional(),
  imageHint: z.string().optional(),
  assignment: z.string().optional(),
  assignedCaseId: z.string().optional(),
  assignmentStartDate: z.string().optional(),
  assignmentEndDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>

interface NewBikeFormProps {
  onBikeSubmit: (data: BikeFrontend) => void | Promise<void>;
  bikeToEdit?: BikeFrontend | null;
}

const stateOptions = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
const serviceCenterOptions = ["Official Yamaha Service", "City Bikes", "Pro-Tune Mechanics", "Race-Spec Tuning", "Official Ducati Service", "Other"];

export function NewBikeForm({ onBikeSubmit, bikeToEdit }: NewBikeFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const defaultValues = bikeToEdit ? {
    ...bikeToEdit,
    registrationExpires: bikeToEdit.registrationExpires ? new Date(bikeToEdit.registrationExpires) : undefined,
    lastServiceDate: bikeToEdit.lastServiceDate ? new Date(bikeToEdit.lastServiceDate) : undefined,
  } : {
    make: "",
    model: "",
    status: "available" as const,
    location: "Main Warehouse",
    imageUrl: "https://placehold.co/300x200.png",
    imageHint: "motorcycle sport",
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });
  
  const [imagePreview, setImagePreview] = useState(defaultValues.imageUrl || "https://placehold.co/300x200.png");

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        form.setValue("imageUrl", dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const submittedData: BikeFrontend = {
      ...values,
      id: bikeToEdit?.id || `M${Date.now().toString().slice(-4)}`,
      assignment: bikeToEdit?.assignment || '-',
      imageUrl: form.getValues("imageUrl") || "https://placehold.co/300x200.png",
      imageHint: values.imageHint || "motorcycle sport",
      registrationExpires: values.registrationExpires ? format(values.registrationExpires, "yyyy-MM-dd") : '',
      lastServiceDate: values.lastServiceDate ? format(values.lastServiceDate, "yyyy-MM-dd") : '',
    };
    
    onBikeSubmit(submittedData);
    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column for Form */}
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Bike Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="make" render={({ field }) => (
                                <FormItem><FormLabel>Make</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="model" render={({ field }) => (
                                <FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="registration" render={({ field }) => (
                                <FormItem><FormLabel>Registration</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="registrationExpires" render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>Registration Expiry</FormLabel><Popover><PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date("1900-01-01")} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="serviceCenter" render={({ field }) => (
                              <FormItem><FormLabel>Service Center</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Select Service Center" /></SelectTrigger></FormControl>
                                  <SelectContent>{serviceCenterOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                                </Select><FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="serviceCenterContactId" render={({ field }) => (
                                <FormItem><FormLabel>Service Center Contact</FormLabel><FormControl><Input placeholder="Contact ID or Name" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="deliveryStreet" render={({ field }) => (
                                <FormItem><FormLabel>Delivery Street</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="deliverySuburb" render={({ field }) => (
                                <FormItem><FormLabel>Delivery Suburb</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <FormField control={form.control} name="deliveryState" render={({ field }) => (
                              <FormItem><FormLabel>Delivery State</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger></FormControl>
                                  <SelectContent>{stateOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                                </Select><FormMessage />
                              </FormItem>
                            )} />
                             <FormField control={form.control} name="deliveryPostcode" render={({ field }) => (
                                <FormItem><FormLabel>Delivery Postcode</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="lastServiceDate" render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>Last Service Date</FormLabel><Popover><PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="serviceNotes" render={({ field }) => (
                                <FormItem><FormLabel>Service Notes</FormLabel><FormControl><Textarea placeholder="Optional service notes..." {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="status" render={({ field }) => (
                              <FormItem><FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="available">Available</SelectItem>
                                    <SelectItem value="assigned">Assigned</SelectItem>
                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                    <SelectItem value="retired">Retired</SelectItem>
                                  </SelectContent>
                                </Select><FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="location" render={({ field }) => (
                                <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g., Main Warehouse" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField control={form.control} name="dailyRate" render={({ field }) => (
                                <FormItem><FormLabel>Daily Rate</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="dailyRateA" render={({ field }) => (
                                <FormItem><FormLabel>Daily Rate A</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="dailyRateB" render={({ field }) => (
                                <FormItem><FormLabel>Daily Rate B</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column for Image */}
            <div className="md:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Bike Image</CardTitle>
                        <CardDescription>Upload an image for the bike.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="aspect-[3/2] w-full rounded-md overflow-hidden border">
                            <Image
                                src={imagePreview}
                                alt="Bike preview"
                                width={300}
                                height={200}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <FormField
                            name="imageUrl"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Upload Image</FormLabel>
                                    <FormControl>
                                        <Input type="file" accept="image/*" onChange={handleImageChange} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="imageHint"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>AI Image Hint</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., sport motorcycle" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => window.history.back()}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {bikeToEdit ? 'Save Changes' : 'Add Bike'}
            </Button>
        </div>
      </form>
    </Form>
  )
}