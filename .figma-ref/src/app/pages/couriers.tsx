import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  Search,
  MoreHorizontal,
  UserPlus,
  Truck,
  TrendingUp,
  Users,
  MapPin,
  Star,
} from "lucide-react";

const couriers = [
  {
    id: "COU-042",
    name: "Tom Courier",
    phone: "+1 (555) 987-6543",
    zone: "Manhattan, NY",
    activeDeliveries: 12,
    completedToday: 8,
    totalDeliveries: 1567,
    rating: 4.8,
    status: "active",
    joinDate: "2024-06-15",
  },
  {
    id: "COU-018",
    name: "Sarah Driver",
    phone: "+1 (555) 876-5432",
    zone: "Brooklyn, NY",
    activeDeliveries: 9,
    completedToday: 15,
    totalDeliveries: 2134,
    rating: 4.9,
    status: "active",
    joinDate: "2024-03-10",
  },
  {
    id: "COU-025",
    name: "Mike Transport",
    phone: "+1 (555) 765-4321",
    zone: "Queens, NY",
    activeDeliveries: 15,
    completedToday: 6,
    totalDeliveries: 1892,
    rating: 4.7,
    status: "active",
    joinDate: "2024-05-22",
  },
  {
    id: "COU-012",
    name: "Lisa Delivery",
    phone: "+1 (555) 654-3210",
    zone: "Bronx, NY",
    activeDeliveries: 0,
    completedToday: 0,
    totalDeliveries: 987,
    rating: 4.6,
    status: "offline",
    joinDate: "2024-08-30",
  },
  {
    id: "COU-067",
    name: "James Runner",
    phone: "+1 (555) 543-2109",
    zone: "Staten Island, NY",
    activeDeliveries: 7,
    completedToday: 11,
    totalDeliveries: 756,
    rating: 4.9,
    status: "active",
    joinDate: "2025-01-05",
  },
];

const statusStyles = {
  active: "bg-green-500/10 text-green-700 hover:bg-green-500/20",
  offline: "bg-gray-500/10 text-gray-700 hover:bg-gray-500/20",
};

export function CouriersPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Couriers</h1>
          <p className="text-muted-foreground">
            Manage delivery personnel and performance
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Courier
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Couriers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold">156</div>
            <p className="text-xs text-muted-foreground">
              48 active now
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Deliveries</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold">342</div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Completed Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold">1,234</div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="text-success">+8%</span> vs yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold">4.7</div>
            <p className="text-xs text-muted-foreground">
              Based on customer feedback
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline">Filters</Button>
        <Button variant="outline">Export</Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Courier</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Completed Today</TableHead>
              <TableHead>Total Deliveries</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {couriers.map((courier) => (
              <TableRow key={courier.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {courier.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{courier.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {courier.id}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {courier.zone}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {courier.activeDeliveries}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {courier.completedToday}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {courier.totalDeliveries}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <span className="font-medium">{courier.rating}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      statusStyles[courier.status as keyof typeof statusStyles]
                    }
                  >
                    {courier.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>View Deliveries</DropdownMenuItem>
                      <DropdownMenuItem>Performance Report</DropdownMenuItem>
                      <DropdownMenuItem>Assign Shipments</DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
