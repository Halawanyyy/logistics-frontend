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
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Search,
  MoreHorizontal,
  PackagePlus,
  PackageMinus,
  Package,
  AlertTriangle,
  TrendingUp,
  Archive,
} from "lucide-react";

const inventory = [
  {
    sku: "SKU-ELEC-001",
    name: "Wireless Headphones",
    category: "Electronics",
    stock: 245,
    reserved: 45,
    available: 200,
    minStock: 50,
    status: "in-stock",
  },
  {
    sku: "SKU-CLOT-045",
    name: "Cotton T-Shirt (Blue)",
    category: "Clothing",
    stock: 89,
    reserved: 25,
    available: 64,
    minStock: 100,
    status: "low-stock",
  },
  {
    sku: "SKU-HOME-123",
    name: "Coffee Maker",
    category: "Home & Kitchen",
    stock: 0,
    reserved: 0,
    available: 0,
    minStock: 20,
    status: "out-of-stock",
  },
  {
    sku: "SKU-SPRT-078",
    name: "Yoga Mat",
    category: "Sports",
    stock: 156,
    reserved: 12,
    available: 144,
    minStock: 30,
    status: "in-stock",
  },
  {
    sku: "SKU-ELEC-092",
    name: "USB-C Cable (2m)",
    category: "Electronics",
    stock: 523,
    reserved: 89,
    available: 434,
    minStock: 100,
    status: "in-stock",
  },
];

const statusStyles = {
  "in-stock": "bg-green-500/10 text-green-700 hover:bg-green-500/20",
  "low-stock": "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20",
  "out-of-stock": "bg-red-500/10 text-red-700 hover:bg-red-500/20",
};

export function WarehousePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Warehouse</h1>
          <p className="text-muted-foreground">
            Manage inventory and stock levels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/warehouse/stock-out")}>
            <PackageMinus className="mr-2 h-4 w-4" />
            Stock Out
          </Button>
          <Button onClick={() => navigate("/warehouse/stock-in")}>
            <PackagePlus className="mr-2 h-4 w-4" />
            Stock In
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold">1,234</div>
            <p className="text-xs text-muted-foreground">
              Across 12 categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Stock Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold">$1.2M</div>
            <p className="text-xs text-success">+5.2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-warning">23</div>
            <p className="text-xs text-muted-foreground">
              Needs reordering
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Out of Stock</CardTitle>
            <Archive className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-destructive">8</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by SKU, name, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="electronics">Electronics</SelectItem>
            <SelectItem value="clothing">Clothing</SelectItem>
            <SelectItem value="home">Home & Kitchen</SelectItem>
            <SelectItem value="sports">Sports</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="in-stock">In Stock</SelectItem>
            <SelectItem value="low-stock">Low Stock</SelectItem>
            <SelectItem value="out-of-stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Total Stock</TableHead>
              <TableHead>Reserved</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Min Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item.sku}>
                <TableCell className="font-mono">{item.sku}</TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {item.category}
                </TableCell>
                <TableCell>{item.stock}</TableCell>
                <TableCell className="text-muted-foreground">
                  {item.reserved}
                </TableCell>
                <TableCell className="font-medium">{item.available}</TableCell>
                <TableCell className="text-muted-foreground">
                  {item.minStock}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={statusStyles[item.status as keyof typeof statusStyles]}
                  >
                    {item.status.replace("-", " ")}
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
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Stock In</DropdownMenuItem>
                      <DropdownMenuItem>Stock Out</DropdownMenuItem>
                      <DropdownMenuItem>View History</DropdownMenuItem>
                      <DropdownMenuItem>Edit Product</DropdownMenuItem>
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
