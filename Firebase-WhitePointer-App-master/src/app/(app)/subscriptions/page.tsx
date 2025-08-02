import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const features = [
    "Up to 100 cases",
    "Fleet tracking for 50 bikes",
    "AI Email Generation",
    "Document Storage (10 GB)",
    "Standard Support",
];

export default function SubscriptionsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Subscription Management</h1>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Your Plan</CardTitle>
          <CardDescription>You are currently on the <span className="font-semibold text-primary">Pro Plan</span>.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <div className="text-center">
                    <p className="text-4xl font-bold">$99<span className="text-xl font-normal text-muted-foreground">/mo</span></p>
                    <p className="text-xs text-muted-foreground">Your next billing date is August 1, 2024.</p>
                </div>
                <ul className="space-y-2">
                    {features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            <span className="text-sm">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </CardContent>
        <CardFooter className="border-t pt-6">
            <Button className="w-full">Manage Subscription</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
