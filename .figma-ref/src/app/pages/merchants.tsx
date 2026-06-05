import { useState } from "react";
import { useNavigate } from "react-router";
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
  Eye,
  DollarSign,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";

const merchants = [
  {
    id: "MER-001",
    name: "Merchant A",
    company: "A-Commerce Ltd",
    email: "contact@a-commerce.com",
    phone: "+1 (555) 111-2222",
    activeShipments: 45,
    totalShipments: 1234,
    revenue: 45600,
    balance: 12500,
    status: "active",
    joinDate: "2025-01-15",
  },
  {
    id: "MER-002",
    name: "Merchant B",
    company: "B-Store Inc",
    email: "hello@b-store.com",
    phone: "+1 (555) 333-4444",
    activeShipments: 28,
    totalShipments: 892,
    revenue: 32400,
    balance: 8900,
    status: "active",
    joinDate: "2025-03-20",
  },
  {
    id: "MER-003",
    name: "Merchant C",
    company: "C-Shop Co",
    email: "info@c-shop.com",
    phone: "+1 (555) 555-6666",
    activeShipments: 62,
    totalShipments: 2156,
    revenue: 68900,
    balance: 15600,
    status: "active",
    joinDate: "2024-11-08",
  },
  {
    id: "MER-004",
    name: "Merchant D",
    company: "D-Market",
    email: "support@d-market.com",
    phone: "+1 (555) 777-8888",
    activeShipments: 0,
    totalShipments: 156,
    revenue: 8900,
    balance: 0,
    status: "inactive",
    joinDate: "2025-08-12",
  },
];

const statusStyles = {
  active: "bg-green-500/10 text-green-700 hover:bg-green-500/20",
  inactive: "bg-gray-500/10 text-gray-700 hover:bg-gray-500/20",
};

export function MerchantsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Merchants</h1>
          <p className="text-muted-foreground">
            Manage merchant accounts and partnerships
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Merchant
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Merchants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold">247</div>
            <p className="text-xs text-muted-foreground">
              218 active, 29 inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold">$155,800</div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-success">+18.2%</span> this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold">135</div>
            <p className="text-xs text-muted-foreground">
              Across all merchants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Pending Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-warning">$37,000</div>
            <p className="text-xs text-muted-foreground">8 requests</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, company, email..."
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
              <TableHead>Merchant</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Active Shipments</TableHead>
              <TableHead>Total Shipments</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {merchants.map((merchant) => (
              <TableRow key={merchant.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {merchant.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{merchant.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {merchant.company}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{merchant.email}</div>
                    <div className="text-muted-foreground">
                      {merchant.phone}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {merchant.activeShipments}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {merchant.totalShipments}
                </TableCell>
                <TableCell className="font-medium">
                  ${merchant.revenue.toLocaleString()}
                </TableCell>
                <TableCell className="font-medium text-primary">
                  ${merchant.balance.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      statusStyles[merchant.status as keyof typeof statusStyles]
                    }
                  >
                    {merchant.status}
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
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>View Shipments</DropdownMenuItem>
                      <DropdownMenuItem>Financial Statement</DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>
                        {merchant.status === "active"
                          ? "Deactivate"
                          : "Activate"}
                      </DropdownMenuItem>
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
