import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  Download,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const revenueData = [
  { month: "Jan", revenue: 45000, collected: 42000 },
  { month: "Feb", revenue: 52000, collected: 48000 },
  { month: "Mar", revenue: 48000, collected: 46000 },
  { month: "Apr", revenue: 61000, collected: 58000 },
  { month: "May", revenue: 55000, collected: 52000 },
  { month: "Jun", revenue: 67000, collected: 64000 },
];

const transactions = [
  {
    id: "TXN-2026-5432",
    type: "COD Collection",
    merchant: "Merchant A",
    amount: 2450.0,
    status: "completed",
    date: "2026-04-23",
  },
  {
    id: "TXN-2026-5431",
    type: "Payout",
    merchant: "Merchant B",
    amount: -5200.0,
    status: "completed",
    date: "2026-04-22",
  },
  {
    id: "TXN-2026-5430",
    type: "COD Collection",
    merchant: "Merchant C",
    amount: 1890.0,
    status: "pending",
    date: "2026-04-22",
  },
  {
    id: "TXN-2026-5429",
    type: "Shipping Fee",
    merchant: "Merchant A",
    amount: 450.0,
    status: "completed",
    date: "2026-04-21",
  },
  {
    id: "TXN-2026-5428",
    type: "Payout",
    merchant: "Merchant D",
    amount: -3100.0,
    status: "processing",
    date: "2026-04-21",
  },
];

const payoutRequests = [
  {
    id: "PAY-001",
    merchant: "Merchant A",
    amount: 12500.0,
    requestDate: "2026-04-23",
    status: "pending",
  },
  {
    id: "PAY-002",
    merchant: "Merchant B",
    amount: 8900.0,
    requestDate: "2026-04-22",
    status: "approved",
  },
  {
    id: "PAY-003",
    merchant: "Merchant C",
    amount: 15600.0,
    requestDate: "2026-04-22",
    status: "processing",
  },
];

const statusStyles = {
  completed: "bg-green-500/10 text-green-700 hover:bg-green-500/20",
  pending: "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20",
  processing: "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20",
  approved: "bg-green-500/10 text-green-700 hover:bg-green-500/20",
};

export function FinancialPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Financial</h1>
          <p className="text-muted-foreground">
            Track revenue, collections, and payouts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button>Process Payouts</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold">$67,450</div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-success">+12.3%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Collected Amount</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold">$64,200</div>
            <p className="text-xs text-muted-foreground">95.2% collection rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Pending Collections</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-warning">$3,250</div>
            <p className="text-xs text-muted-foreground">12 shipments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Available Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-primary">$37,100</div>
            <p className="text-xs text-muted-foreground">Ready for payout</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              <Area
                type="monotone"
                dataKey="collected"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorCollected)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Payout Requests</TabsTrigger>
          <TabsTrigger value="merchants">Merchant Statements</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search transactions..." className="pl-9" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="collection">COD Collection</SelectItem>
                <SelectItem value="payout">Payout</SelectItem>
                <SelectItem value="fee">Shipping Fee</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-mono">{txn.id}</TableCell>
                    <TableCell>{txn.type}</TableCell>
                    <TableCell>{txn.merchant}</TableCell>
                    <TableCell>
                      <div
                        className={`flex items-center gap-1 font-medium ${
                          txn.amount > 0 ? "text-success" : "text-foreground"
                        }`}
                      >
                        {txn.amount > 0 ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        ${Math.abs(txn.amount).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          statusStyles[txn.status as keyof typeof statusStyles]
                        }
                      >
                        {txn.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {txn.date}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payout ID</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutRequests.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-mono">{payout.id}</TableCell>
                    <TableCell>{payout.merchant}</TableCell>
                    <TableCell className="font-medium">
                      ${payout.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payout.requestDate}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          statusStyles[payout.status as keyof typeof statusStyles]
                        }
                      >
                        {payout.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payout.status === "pending" && (
                        <Button size="sm">Approve</Button>
                      )}
                      {payout.status === "approved" && (
                        <Button size="sm" variant="outline">
                          Process
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="merchants">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <h3>Merchant Statements</h3>
                <p className="text-muted-foreground">
                  Select a merchant to view their financial statement
                </p>
                <Button className="mt-4">View Merchants</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
