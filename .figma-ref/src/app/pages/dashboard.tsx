import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Truck,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const shipmentData = [
  { date: "Mon", shipments: 245, revenue: 12400 },
  { date: "Tue", shipments: 312, revenue: 15800 },
  { date: "Wed", shipments: 289, revenue: 14600 },
  { date: "Thu", shipments: 401, revenue: 20300 },
  { date: "Fri", shipments: 378, revenue: 19100 },
  { date: "Sat", shipments: 195, revenue: 9800 },
  { date: "Sun", shipments: 156, revenue: 7900 },
];

const recentActivity = [
  {
    id: 1,
    type: "shipment",
    title: "New shipment created",
    description: "SHP-2026-001234 by Merchant A",
    time: "2 min ago",
    status: "success",
  },
  {
    id: 2,
    type: "delivery",
    title: "Shipment delivered",
    description: "SHP-2026-001198 completed",
    time: "15 min ago",
    status: "success",
  },
  {
    id: 3,
    type: "alert",
    title: "Delayed shipment",
    description: "SHP-2026-001187 needs attention",
    time: "1 hour ago",
    status: "warning",
  },
  {
    id: 4,
    type: "payment",
    title: "Payment collected",
    description: "$2,450 COD from 5 shipments",
    time: "2 hours ago",
    status: "success",
  },
];

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Export</Button>
          <Button>Create Shipment</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold">1,976</div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-success">+12.5%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold">$99,900</div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-success">+8.2%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Couriers</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold">48</div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-destructive" />
              <span className="text-destructive">-2</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Pending Actions</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold">12</div>
            <p className="text-xs text-muted-foreground">
              Requires your attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Shipment Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={shipmentData}>
                <defs>
                  <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="shipments"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorShipments)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Shipment Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="font-medium">Pending Pickup</div>
                  <div className="text-sm text-muted-foreground">
                    Awaiting courier
                  </div>
                </div>
              </div>
              <div className="font-semibold">124</div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Truck className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <div className="font-medium">In Transit</div>
                  <div className="text-sm text-muted-foreground">
                    On the way
                  </div>
                </div>
              </div>
              <div className="font-semibold">342</div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="font-medium">Delivered</div>
                  <div className="text-sm text-muted-foreground">
                    This week
                  </div>
                </div>
              </div>
              <div className="font-semibold">1,510</div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <div className="font-medium">Issues</div>
                  <div className="text-sm text-muted-foreground">
                    Needs attention
                  </div>
                </div>
              </div>
              <div className="font-semibold text-destructive">8</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={shipmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Button variant="ghost" size="sm">
              View all
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                      activity.status === "success"
                        ? "bg-success/10"
                        : "bg-warning/10"
                    }`}
                  >
                    {activity.status === "success" ? (
                      <CheckCircle
                        className={`h-4 w-4 ${
                          activity.status === "success"
                            ? "text-success"
                            : "text-warning"
                        }`}
                      />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-warning" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{activity.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {activity.description}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
