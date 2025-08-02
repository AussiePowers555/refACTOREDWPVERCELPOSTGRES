import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Bike, Banknote, Shield } from "lucide-react"

import { ChartContainer, ChartTooltip, ChartTooltipContent, BarChart, Bar, XAxis, YAxis } from "@/components/ui/chart"

const chartData = [
  { status: "Available", count: 18, fill: "var(--color-available)" },
  { status: "Rented", count: 9, fill: "var(--color-rented)" },
  { status: "Maintenance", count: 4, fill: "var(--color-maintenance)" },
]

const chartConfig = {
  count: {
    label: "Count",
  },
  available: {
    label: "Available",
    color: "hsl(var(--chart-1))",
  },
  rented: {
    label: "Rented",
    color: "hsl(var(--chart-2))",
  },
  maintenance: {
    label: "Maintenance",
    color: "hsl(var(--chart-4))",
  },
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">13</div>
            <p className="text-xs text-muted-foreground">+2 since last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bikes Available</CardTitle>
            <Bike className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18 / 31</div>
            <p className="text-xs text-muted-foreground">58% availability</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,234.56</div>
            <p className="text-xs text-muted-foreground">Across 3 cases</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Insurance Claims</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">Awaiting settlement</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Cases</CardTitle>
            <CardDescription>An overview of the most recently updated cases.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Assigned Lawyer</TableHead>
                  <TableHead>Assigned Rental Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">2025-001</TableCell>
                  <TableCell>John Smith</TableCell>
                  <TableCell>Smith & Co Lawyers</TableCell>
                  <TableCell>PBikeRescue Rentals</TableCell>
                  <TableCell><Badge>Under Repair</Badge></TableCell>
                  <TableCell>2 hours ago</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">2025-002</TableCell>
                  <TableCell>Emma Thompson</TableCell>
                  <TableCell>Smith & Co Lawyers</TableCell>
                  <TableCell>PBikeRescue Rentals</TableCell>
                  <TableCell><Badge variant="secondary">Processing</Badge></TableCell>
                  <TableCell>1 day ago</TableCell>
                </TableRow>
                 <TableRow>
                  <TableCell className="font-medium">2024-135</TableCell>
                  <TableCell>Michael Chen</TableCell>
                  <TableCell>Davis Legal</TableCell>
                  <TableCell>City Wide Rentals</TableCell>
                  <TableCell><Badge variant="destructive">Overdue</Badge></TableCell>
                  <TableCell>3 days ago</TableCell>
                </TableRow>
                 <TableRow>
                  <TableCell className="font-medium">2025-003</TableCell>
                  <TableCell>Olivia Wilson</TableCell>
                  <TableCell>Davis Legal</TableCell>
                  <TableCell>City Wide Rentals</TableCell>
                  <TableCell><Badge variant="outline">New Matter</Badge></TableCell>
                  <TableCell>5 days ago</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fleet Status</CardTitle>
            <CardDescription>Current distribution of the bike fleet.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <YAxis
                  dataKey="status"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                />
                <XAxis dataKey="count" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="count" radius={5} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
