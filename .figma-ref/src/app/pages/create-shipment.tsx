import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { ArrowLeft, Package, User, MapPin, DollarSign, CheckCircle } from "lucide-react";
import { motion } from "motion/react";

const steps = [
  { id: 1, name: "Merchant & Product", icon: Package },
  { id: 2, name: "Customer Details", icon: User },
  { id: 3, name: "Delivery Info", icon: MapPin },
  { id: 4, name: "Pricing & COD", icon: DollarSign },
];

export function CreateShipmentPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/shipments");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate("/shipments");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/shipments")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1>Create New Shipment</h1>
          <p className="text-muted-foreground">
            Step {currentStep} of {steps.length}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-1 items-center">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  currentStep > step.id
                    ? "bg-success text-success-foreground"
                    : currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > step.id ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <div>
                <div
                  className={`text-sm font-medium ${
                    currentStep >= step.id
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.name}
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-4 h-0.5 flex-1 ${
                  currentStep > step.id ? "bg-success" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="merchant">Merchant</Label>
                    <Select>
                      <SelectTrigger id="merchant">
                        <SelectValue placeholder="Select merchant" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="merchant-a">Merchant A</SelectItem>
                        <SelectItem value="merchant-b">Merchant B</SelectItem>
                        <SelectItem value="merchant-c">Merchant C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warehouse">Pickup Location</Label>
                    <Select>
                      <SelectTrigger id="warehouse">
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warehouse-1">Brooklyn Warehouse</SelectItem>
                        <SelectItem value="warehouse-2">Manhattan Hub</SelectItem>
                        <SelectItem value="warehouse-3">Queens Center</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3>Product Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="product-name">Product Name</Label>
                      <Input id="product-name" placeholder="Enter product name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product-value">Product Value</Label>
                      <Input
                        id="product-value"
                        type="number"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input id="weight" type="number" placeholder="0.0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input id="quantity" type="number" placeholder="1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any special instructions..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customer-name">Customer Name</Label>
                    <Input id="customer-name" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-phone">Phone Number</Label>
                    <Input
                      id="customer-phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-email">Email (Optional)</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    placeholder="customer@example.com"
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input id="address" placeholder="123 Main Street, Apt 4B" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="New York" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select>
                      <SelectTrigger id="state">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ny">New York</SelectItem>
                        <SelectItem value="ca">California</SelectItem>
                        <SelectItem value="tx">Texas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input id="zip" placeholder="10001" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-notes">Delivery Instructions</Label>
                  <Textarea
                    id="delivery-notes"
                    placeholder="Ring doorbell, leave at door, etc..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="shipping-fee">Shipping Fee</Label>
                    <Input id="shipping-fee" type="number" placeholder="8.50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cod-fee">COD Fee</Label>
                    <Input id="cod-fee" type="number" placeholder="2.50" />
                  </div>
                </div>

                <Separator />

                <div className="rounded-lg border bg-muted/50 p-4">
                  <h3 className="mb-4">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Product Value</span>
                      <span className="font-medium">$125.00</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Shipping Fee</span>
                      <span className="font-medium">$8.50</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">COD Fee</span>
                      <span className="font-medium">$2.50</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total COD Amount</span>
                      <span className="font-semibold text-primary">$136.00</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack}>
          {currentStep === 1 ? "Cancel" : "Back"}
        </Button>
        <Button onClick={handleNext}>
          {currentStep === steps.length ? "Create Shipment" : "Next"}
        </Button>
      </div>
    </div>
  );
}
