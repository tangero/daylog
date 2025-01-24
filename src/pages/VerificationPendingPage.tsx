import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

export default function VerificationPendingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [countdown, setCountdown] = useState(0);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Get email from location state
    const searchParams = new URLSearchParams(location.search);
    setEmail(searchParams.get("email") || "");

    // Load last resend timestamp from localStorage
    const lastResend = localStorage.getItem("lastResendTimestamp");
    if (lastResend) {
      const timeLeft =
        60 - Math.floor((Date.now() - parseInt(lastResend)) / 1000);
      if (timeLeft > 0) {
        setCountdown(timeLeft);
      }
    }
  }, [location]);

  useEffect(() => {
    let timer: number;
    if (countdown > 0) {
      timer = window.setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResendEmail = async () => {
    if (countdown > 0 || !email) return;

    try {
      const response = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: "Email odeslán",
        description: "Nový ověřovací email byl odeslán na vaši adresu.",
      });

      setCountdown(60);
      localStorage.setItem("lastResendTimestamp", Date.now().toString());
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Chyba",
        description:
          error instanceof Error
            ? error.message
            : "Nepodařilo se odeslat email",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md p-6 space-y-6 bg-white text-center">
        <div className="flex justify-center">
          <Mail className="h-12 w-12 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Ověřte svůj email</h1>
          <p className="text-gray-500">
            Na váš email jsme odeslali odkaz pro ověření. Prosím zkontrolujte
            svou emailovou schránku a klikněte na odkaz pro dokončení
            registrace.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/login")}
          >
            Přejít na přihlášení
          </Button>
          <p className="text-sm text-gray-500">
            Neobdrželi jste email?{" "}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={handleResendEmail}
              disabled={countdown > 0}
            >
              {countdown > 0 ? `Poslat znovu (${countdown}s)` : "Poslat znovu"}
            </Button>
          </p>
        </div>
      </Card>
    </div>
  );
}
