import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setError("Chybí verifikační token");
        return;
      }

      try {
        const response = await fetch("/api/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        setStatus("success");
      } catch (err) {
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "Nepodařilo se ověřit email",
        );
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md p-6 space-y-6 bg-white text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p>Ověřuji email...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold">Email byl úspěšně ověřen</h1>
            <p className="text-gray-500">
              Váš email byl úspěšně ověřen. Nyní se můžete přihlásit do
              aplikace.
            </p>
            <Button onClick={() => navigate("/login")} className="w-full">
              Přejít na přihlášení
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold">Chyba při ověření</h1>
            <p className="text-red-500">{error}</p>
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
              className="w-full"
            >
              Přejít na přihlášení
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
