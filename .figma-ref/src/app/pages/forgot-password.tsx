import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Package, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { motion } from "motion/react";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background px-4">
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

        {!submitted ? (
          <div>
            <div className="mb-8">
              <h2>Forgot your password?</h2>
              <p className="text-muted-foreground">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@logisticspro.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <Button type="submit" className="h-11 w-full">
                <Mail className="mr-2 h-4 w-4" />
                Send Reset Link
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="mb-2">Check your email</h2>
            <p className="mb-8 text-muted-foreground">
              We've sent a password reset link to{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Return to Login
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
