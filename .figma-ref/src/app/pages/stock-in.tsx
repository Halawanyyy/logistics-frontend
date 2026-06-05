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
import { Badge } from "../components/ui/badge";
import { ArrowLeft, PackagePlus, Barcode, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function StockInPage() {
  const navigate = useNavigate();
  const [generatedSKU, setGeneratedSKU] = useState("SKU-ELEC-2026-001");
  const [copied, setCopied] = useState(false);

  const handleCopySKU = () => {
    navigator.clipboard.writeText(generatedSKU);
    setCopied(true);
    toast.success("SKU copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Stock added successfully");
    navigate("/warehouse");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/warehouse")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1>Stock In</h1>
          <p className="text-muted-foreground">Add new inventory to warehouse</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PackagePlus className="h-5 w-5" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="product-name">Product Name</Label>
                    <Input
                      id="product-name"
                      placeholder="Wireless Headphones"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select required>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="clothing">Clothing</SelectItem>
                        <SelectItem value="home">Home & Kitchen</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="100"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-stock">Min Stock Level</Label>
                    <Input
                      id="min-stock"
                      type="number"
                      placeholder="50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit-price">Unit Price</Label>
                    <Input
                      id="unit-price"
                      type="number"
                      step="0.01"
                      placeholder="29.99"
                      required
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Product description, specifications, etc..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Warehouse Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="warehouse">Warehouse Location</Label>
                    <Select required>
                      <SelectTrigger id="warehouse">
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warehouse-1">
                          Brooklyn Warehouse
                        </SelectItem>
                        <SelectItem value="warehouse-2">Manhattan Hub</SelectItem>
                        <SelectItem value="warehouse-3">
                          Queens Center
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      placeholder="Supplier name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes about this stock..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Barcode className="h-5 w-5" />
                  Auto-Generated SKU
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border-2 border-dashed bg-muted/50 p-4 text-center">
                  <div className="mb-2 font-mono text-lg font-semibold">
                    {generatedSKU}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Auto-generated unique identifier
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleCopySKU}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4 text-success" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy SKU
                    </>
                  )}
                </Button>

                <div className="rounded-lg bg-background p-4">
                  <div className="mb-2 text-center text-sm font-medium">
                    Barcode Preview
                  </div>
                  <div className="flex items-center justify-center">
                    <svg width="200" height="80" viewBox="0 0 200 80">
                      <rect x="10" y="10" width="2" height="50" fill="black" />
                      <rect x="15" y="10" width="4" height="50" fill="black" />
                      <rect x="22" y="10" width="2" height="50" fill="black" />
                      <rect x="27" y="10" width="6" height="50" fill="black" />
                      <rect x="36" y="10" width="2" height="50" fill="black" />
                      <rect x="41" y="10" width="4" height="50" fill="black" />
                      <rect x="48" y="10" width="2" height="50" fill="black" />
                      <rect x="53" y="10" width="6" height="50" fill="black" />
                      <rect x="62" y="10" width="2" height="50" fill="black" />
                      <rect x="67" y="10" width="4" height="50" fill="black" />
                      <rect x="74" y="10" width="2" height="50" fill="black" />
                      <rect x="79" y="10" width="6" height="50" fill="black" />
                      <rect x="88" y="10" width="2" height="50" fill="black" />
                      <rect x="93" y="10" width="4" height="50" fill="black" />
                      <rect x="100" y="10" width="2" height="50" fill="black" />
                      <rect x="105" y="10" width="6" height="50" fill="black" />
                      <rect x="114" y="10" width="2" height="50" fill="black" />
                      <rect x="119" y="10" width="4" height="50" fill="black" />
                      <rect x="126" y="10" width="2" height="50" fill="black" />
                      <rect x="131" y="10" width="6" height="50" fill="black" />
                      <rect x="140" y="10" width="2" height="50" fill="black" />
                      <rect x="145" y="10" width="4" height="50" fill="black" />
                      <rect x="152" y="10" width="2" height="50" fill="black" />
                      <rect x="157" y="10" width="6" height="50" fill="black" />
                      <rect x="166" y="10" width="2" height="50" fill="black" />
                      <rect x="171" y="10" width="4" height="50" fill="black" />
                      <rect x="178" y="10" width="2" height="50" fill="black" />
                      <rect x="183" y="10" width="6" height="50" fill="black" />
                      <text
                        x="100"
                        y="73"
                        textAnchor="middle"
                        fontSize="10"
                        fill="black"
                      >
                        {generatedSKU}
                      </text>
                    </svg>
                  </div>
                </div>

                <Button type="button" variant="outline" className="w-full">
                  Print Label
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-700">
                    Ready to Add
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">SKU</span>
                  <span className="font-mono font-medium">{generatedSKU}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">April 23, 2026</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Button type="submit" className="w-full">
                <PackagePlus className="mr-2 h-4 w-4" />
                Add to Inventory
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/warehouse")}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
