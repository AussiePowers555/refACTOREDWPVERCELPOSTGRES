import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Phone, Mail, MoreVertical } from "lucide-react";
import Image from "next/image";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const providers = [
  { name: "AllState Insurance", contactPerson: "Sarah Johnson", phone: "555-0101", email: "sarah.j@allstate.com", logoUrl: "https://placehold.co/48x48.png", imageHint: "logo abstract" },
  { name: "Geico", contactPerson: "Mike Brown", phone: "555-0102", email: "mike.b@geico.com", logoUrl: "https://placehold.co/48x48.png", imageHint: "logo animal" },
  { name: "Progressive", contactPerson: "Linda Davis", phone: "555-0103", email: "l.davis@progressive.com", logoUrl: "https://placehold.co/48x48.png", imageHint: "logo text" },
  { name: "State Farm", contactPerson: "Robert Miller", phone: "555-0104", email: "r.miller@statefarm.com", logoUrl: "https://placehold.co/48x48.png", imageHint: "logo abstract" },
];

export default function InsurancePage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Insurance Management</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Now in Contacts</CardTitle>
          <CardDescription>This page is now part of Contacts. Please manage Insurance providers from the Contacts page.</CardDescription>
        </CardHeader>
        <CardContent>
        </CardContent>
      </Card>
    </div>
  );
}
