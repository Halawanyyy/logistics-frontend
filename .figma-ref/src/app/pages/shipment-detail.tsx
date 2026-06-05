import { useParams, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import {
  ArrowLeft,
  Package,
  MapPin,
  User,
  DollarSign,
  Truck,
  CheckCircle,
  Clock,
  Edit,
  Download,
} from "lucide-react";

const timelineEvents = [
  {
    id: 1,
    title: "Shipment Created",
    description: "Shipment created by Merchant A",
    timestamp: "2026-04-23 09:15 AM",
    status: "completed",
  },
  {
    id: 2,
    title: "Pickup Scheduled",
    description: "Assigned to Courier #42",
    timestamp: "2026-04-23 09:30 AM",
    status: "completed",
  },
  {
    id: 3,
    title: "Package Picked Up",
    description: "Package collected from warehouse",
    timestamp: "2026-04-23 11:45 AM",
    status: "completed",
  },
  {
    id: 4,
    title: "In Transit",
    description: "Package on the way to destination",
    timestamp: "2026-04-23 02:20 PM",
    status: "current",
  },
  {
    id: 5,
    title: "Out for Delivery",
    description: "Package will be delivered today",
    timestamp: "Expected: 2026-04-23 06:00 PM",
    status: "pending",
  },
];

export function ShipmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/shipments")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1>Shipment Details</h1>
            <p className="font-mono text-muted-foreground">{id}</p>
          </div>
          <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20">
            In Transit
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Label
          </Button>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button>Update Status</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Shipment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        Tracking ID
                      </div>
                      <div className="font-mono font-medium">{id}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        Created Date
                      </div>
                      <div className="font-medium">April 23, 2026</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        Package Weight
                      </div>
                      <div className="font-medium">2.5 kg</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        Dimensions
                      </div>
                      <div className="font-medium">30 x 20 x 15 cm</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Name</div>
                      <div className="font-medium">John Doe</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Phone</div>
                      <div className="font-medium">+1 (555) 123-4567</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Address
                      </div>
                      <div className="font-medium">
                        123 Main Street, Apt 4B
                        <br />
                        New York, NY 10001
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Merchant Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Merchant
                      </div>
                      <div className="font-medium">Merchant A</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Warehouse
                      </div>
                      <div className="font-medium">Brooklyn Warehouse</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Reference
                      </div>
                      <div className="font-medium">#ORDER-98765</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="timeline">
              <Card>
                <CardHeader>
                  <CardTitle>Shipment Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative space-y-6">
                    {timelineEvents.map((event, index) => (
                      <div key={event.id} className="relative flex gap-4 pb-6">
                        <div className="relative flex flex-col items-center">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${
                              event.status === "completed"
                                ? "bg-success/10"
                                : event.status === "current"
                                ? "bg-primary/10"
                                : "bg-muted"
                            }`}
                          >
                            {event.status === "completed" ? (
                              <CheckCircle className="h-5 w-5 text-success" />
                            ) : event.status === "current" ? (
                              <Clock className="h-5 w-5 text-primary" />
                            ) : (
                              <Clock className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          {index < timelineEvents.length - 1 && (
                            <div
                              className={`w-0.5 flex-1 ${
                                event.status === "completed"
                                  ? "bg-success/30"
                                  : "bg-border"
                              }`}
                              style={{ minHeight: "2rem" }}
                            />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {event.description}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {event.timestamp}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Product Value</span>
                    <span className="font-medium">$125.00</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Shipping Fee</span>
                    <span className="font-medium">$8.50</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">COD Fee</span>
                    <span className="font-medium">$2.50</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total COD Amount</span>
                    <span className="font-semibold">$136.00</span>
                  </div>
                  <Separator />
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Amount to Collect
                      </span>
                      <span className="font-semibold text-primary">$136.00</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Status updated to In Transit</div>
                        <div className="text-xs text-muted-foreground">
                          2026-04-23 02:20 PM
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        By: Courier #42
                      </div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Package picked up</div>
                        <div className="text-xs text-muted-foreground">
                          2026-04-23 11:45 AM
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        By: Courier #42
                      </div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Courier assigned</div>
                        <div className="text-xs text-muted-foreground">
                          2026-04-23 09:30 AM
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        By: System Auto-assign
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Assigned Courier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  TC
                </div>
                <div>
                  <div className="font-medium">Tom Courier</div>
                  <div className="text-sm text-muted-foreground">
                    Courier #42
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Phone</div>
                <div className="font-medium">+1 (555) 987-6543</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Active Deliveries
                </div>
                <div className="font-medium">12 shipments</div>
              </div>
              <Button className="w-full" variant="outline">
                Contact Courier
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                Update Status
              </Button>
              <Button className="w-full" variant="outline">
                Reassign Courier
              </Button>
              <Button className="w-full" variant="outline">
                Print Label
              </Button>
              <Button className="w-full" variant="outline">
                Add Note
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
