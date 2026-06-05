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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  Package,
} from "lucide-react";

const shipments = [
  {
    id: "SHP-2026-001234",
    merchant: "Merchant A",
    customer: "John Doe",
    destination: "New York, NY",
    status: "in-transit",
    courier: "Courier #42",
    cod: "$125.00",
    date: "2026-04-23",
  },
  {
    id: "SHP-2026-001233",
    merchant: "Merchant B",
    customer: "Jane Smith",
    destination: "Los Angeles, CA",
    status: "delivered",
    courier: "Courier #18",
    cod: "$89.50",
    date: "2026-04-22",
  },
  {
    id: "SHP-2026-001232",
    merchant: "Merchant A",
    customer: "Bob Johnson",
    destination: "Chicago, IL",
    status: "pending",
    courier: "Unassigned",
    cod: "$210.00",
    date: "2026-04-23",
  },
  {
    id: "SHP-2026-001231",
    merchant: "Merchant C",
    customer: "Alice Brown",
    destination: "Houston, TX",
    status: "in-transit",
    courier: "Courier #25",
    cod: "$156.75",
    date: "2026-04-22",
  },
  {
    id: "SHP-2026-001230",
    merchant: "Merchant B",
    customer: "Charlie Wilson",
    destination: "Phoenix, AZ",
    status: "issue",
    courier: "Courier #12",
    cod: "$95.00",
    date: "2026-04-21",
  },
];

const statusStyles = {
  pending: "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20",
  "in-transit": "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20",
  delivered: "bg-green-500/10 text-green-700 hover:bg-green-500/20",
  issue: "bg-red-500/10 text-red-700 hover:bg-red-500/20",
};

export function ShipmentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Shipments</h1>
          <p className="text-muted-foreground">
            Manage and track all your shipments
          </p>
        </div>
        <Button onClick={() => navigate("/shipments/create")}>
          <Package className="mr-2 h-4 w-4" />
          Create Shipment
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by ID, merchant, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="issue">Issues</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          More Filters
        </Button>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shipment ID</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Courier</TableHead>
              <TableHead>COD Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((shipment) => (
              <TableRow key={shipment.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell
                  className="font-mono"
                  onClick={() => navigate(`/shipments/${shipment.id}`)}
                >
                  {shipment.id}
                </TableCell>
                <TableCell>{shipment.merchant}</TableCell>
                <TableCell>{shipment.customer}</TableCell>
                <TableCell>{shipment.destination}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={statusStyles[shipment.status as keyof typeof statusStyles]}
                  >
                    {shipment.status.replace("-", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {shipment.courier}
                </TableCell>
                <TableCell className="font-medium">{shipment.cod}</TableCell>
                <TableCell className="text-muted-foreground">
                  {shipment.date}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => navigate(`/shipments/${shipment.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
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
