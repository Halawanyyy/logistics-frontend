import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Package, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="flex h-screen w-full">
      <div className="flex w-full flex-1 items-center justify-center bg-background px-8 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Package className="h-7 w-7" />
            </div>
            <div>
              <h1 className="font-semibold">LogisticsPro</h1>
              <p className="text-sm text-muted-foreground">
                Next-gen logistics platform
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2>Welcome back</h2>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@logisticspro.com"
                defaultValue="admin@logisticspro.com"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  defaultValue="password123"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="h-11 w-full">
              Sign in
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button className="text-primary hover:underline">
              Contact admin
            </button>
          </div>
        </motion.div>
      </div>

      <div className="hidden flex-1 items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 lg:flex">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-md space-y-6 text-center"
        >
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-sm">
            <Package className="h-12 w-12 text-primary" />
          </div>
          <div>
            <h2>Manage logistics at scale</h2>
            <p className="mt-2 text-muted-foreground">
              Track shipments, manage inventory, and optimize your entire
              supply chain from one powerful platform.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="font-semibold text-primary">10K+</div>
              <div className="text-sm text-muted-foreground">
                Daily shipments
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="font-semibold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="font-semibold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Support</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
