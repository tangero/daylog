import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { KeyRound, ArrowLeft } from "lucide-react";

export interface RecoveryFormProps {
  onRecovery?: (
    email: string,
    recoveryCode: string,
    newPassword: string,
  ) => Promise<void>;
  onGenerateCode?: (email: string) => Promise<void>;
}

export default function RecoveryForm({
  onRecovery = async () => {},
  onGenerateCode = async () => {},
}: RecoveryFormProps) {
  const [email, setEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"email" | "code">("email");
  const navigate = useNavigate();

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await onGenerateCode(email);
      setStep("code");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate recovery code",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await onRecovery(email, recoveryCode, newPassword);
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recovery failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "email") {
    return (
      <Card className="w-full max-w-md p-6 space-y-6 bg-white">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Password Recovery</h1>
          <p className="text-gray-500">
            Enter your email to receive a recovery code
          </p>
        </div>

        <form onSubmit={handleGenerateCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            <KeyRound className="w-4 h-4 mr-2" />
            {isLoading ? "Generating..." : "Get Recovery Code"}
          </Button>
        </form>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md p-6 space-y-6 bg-white">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Reset Password</h1>
        <p className="text-gray-500">
          Enter your recovery code and new password
        </p>
      </div>

      <form onSubmit={handleRecovery} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">Recovery Code</Label>
          <Input
            id="code"
            type="text"
            placeholder="Enter recovery code"
            value={recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="space-y-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            <KeyRound className="w-4 h-4 mr-2" />
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setStep("email")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </form>
    </Card>
  );
}
